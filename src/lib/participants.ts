import { randomUUID } from "node:crypto";
import { DISTRICTS, PICKS_PER_DISTRICT } from "@/lib/districts";
import { bumpRevision, ensureDb } from "@/lib/db";
import { getSettings, updateSettings } from "@/lib/settings";
import { registrationSchema } from "@/lib/validation";
import {
  MAX_WARNINGS,
  type DistrictId,
  type MixerDistrictResult,
  type Participant,
  type ParticipantInput,
  type RaceStatus,
} from "@/types/participant";

function rowToParticipant(row: Record<string, unknown>): Participant {
  const warnings = Math.max(
    0,
    Math.min(MAX_WARNINGS, Number(row.warnings ?? 0))
  );
  const status: RaceStatus =
    row.status === "elimine" || warnings >= MAX_WARNINGS
      ? "elimine"
      : "en_course";

  return {
    id: String(row.id),
    nom: String(row.nom),
    prenom: String(row.prenom),
    matricule: String(row.matricule),
    idUnique: String(row.id_unique),
    district: row.district as DistrictId,
    registeredAt: String(row.registered_at),
    selected: Boolean(Number(row.selected ?? 0)),
    warnings,
    status,
  };
}

export async function listParticipants(): Promise<Participant[]> {
  const db = await ensureDb();
  const result = await db.execute(
    `SELECT * FROM participants ORDER BY registered_at ASC`
  );
  return result.rows.map((row) =>
    rowToParticipant(row as Record<string, unknown>)
  );
}

export async function listSelectedParticipants(): Promise<Participant[]> {
  const db = await ensureDb();
  const result = await db.execute(
    `SELECT * FROM participants WHERE selected = 1 ORDER BY district, prenom`
  );
  return result.rows.map((row) =>
    rowToParticipant(row as Record<string, unknown>)
  );
}

export async function addParticipant(
  input: ParticipantInput,
  opts: { allowWhenClosed: boolean }
): Promise<{ participant: Participant } | { error: string; status: number }> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Données invalides",
      status: 400,
    };
  }

  const settings = await getSettings();
  if (settings.mode === "closed" && !opts.allowWhenClosed) {
    return { error: "Les inscriptions sont fermées.", status: 403 };
  }

  const data = parsed.data;
  const db = await ensureDb();

  const dupId = await db.execute({
    sql: `SELECT id FROM participants WHERE id_unique = ?`,
    args: [data.idUnique.trim()],
  });
  if (dupId.rows.length > 0) {
    return { error: "Cet ID unique est déjà utilisé.", status: 409 };
  }

  const dupMat = await db.execute({
    sql: `SELECT id FROM participants WHERE matricule = ?`,
    args: [data.matricule.trim()],
  });
  if (dupMat.rows.length > 0) {
    return { error: "Ce matricule est déjà inscrit.", status: 409 };
  }

  const participant: Participant = {
    id: randomUUID(),
    nom: data.nom.trim(),
    prenom: data.prenom.trim(),
    matricule: data.matricule.trim(),
    idUnique: data.idUnique.trim(),
    district: data.district,
    registeredAt: new Date().toISOString(),
    selected: false,
    warnings: 0,
    status: "en_course",
  };

  try {
    await db.execute({
      sql: `INSERT INTO participants
            (id, nom, prenom, matricule, id_unique, district, registered_at, selected, warnings, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'en_course')`,
      args: [
        participant.id,
        participant.nom,
        participant.prenom,
        participant.matricule,
        participant.idUnique,
        participant.district,
        participant.registeredAt,
      ],
    });
    await bumpRevision(db);
  } catch {
    return { error: "Conflit d’inscription (doublon).", status: 409 };
  }

  return { participant };
}

export async function updateParticipantRace(
  id: string,
  patch: { warnings?: number; status?: RaceStatus }
): Promise<{ participant: Participant } | { error: string; status: number }> {
  const db = await ensureDb();
  const existingRes = await db.execute({
    sql: `SELECT * FROM participants WHERE id = ?`,
    args: [id],
  });
  const row = existingRes.rows[0] as Record<string, unknown> | undefined;
  if (!row) return { error: "Participant introuvable.", status: 404 };

  const existing = rowToParticipant(row);
  if (!existing.selected) {
    return {
      error: "Seuls les tirés au sort peuvent recevoir des avertissements.",
      status: 400,
    };
  }

  let warnings = existing.warnings;
  let status = existing.status;

  if (typeof patch.warnings === "number") {
    warnings = Math.max(0, Math.min(MAX_WARNINGS, Math.floor(patch.warnings)));
  }
  if (patch.status === "en_course" || patch.status === "elimine") {
    status = patch.status;
  }
  if (status === "en_course" && warnings >= MAX_WARNINGS) {
    warnings = MAX_WARNINGS - 1;
  }
  if (warnings >= MAX_WARNINGS) status = "elimine";

  await db.execute({
    sql: `UPDATE participants SET warnings = ?, status = ? WHERE id = ?`,
    args: [warnings, status, id],
  });
  await bumpRevision(db);

  return { participant: { ...existing, warnings, status } };
}

export async function deleteParticipant(
  id: string
): Promise<{ ok: true } | { error: string; status: number }> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: `DELETE FROM participants WHERE id = ?`,
    args: [id],
  });
  if ((result.rowsAffected ?? 0) === 0) {
    return { error: "Participant introuvable.", status: 404 };
  }
  await bumpRevision(db);
  return { ok: true };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function runDistrictMixerFor(
  districtId: DistrictId
): Promise<MixerDistrictResult> {
  const district = DISTRICTS.find((d) => d.id === districtId);
  if (!district) throw new Error("District invalide");

  const db = await ensureDb();
  const poolRes = await db.execute({
    sql: `SELECT * FROM participants WHERE district = ?`,
    args: [districtId],
  });
  const pool = poolRes.rows.map((row) =>
    rowToParticipant(row as Record<string, unknown>)
  );
  const winners = shuffle(pool).slice(0, PICKS_PER_DISTRICT);
  const winnerIds = new Set(winners.map((p) => p.id));

  for (const p of pool) {
    await db.execute({
      sql: `UPDATE participants
            SET selected = ?, warnings = 0, status = 'en_course'
            WHERE id = ?`,
      args: [winnerIds.has(p.id) ? 1 : 0, p.id],
    });
  }

  await updateSettings({ mixerAt: new Date().toISOString() });

  return {
    district: district.id,
    label: district.label,
    pool: pool.length,
    picked: winners.map((p) => ({
      ...p,
      selected: true,
      warnings: 0,
      status: "en_course" as const,
    })),
  };
}

export async function runDistrictMixer(): Promise<{
  results: MixerDistrictResult[];
  totalPicked: number;
}> {
  const results: MixerDistrictResult[] = [];
  let totalPicked = 0;
  for (const district of DISTRICTS) {
    const block = await runDistrictMixerFor(district.id);
    results.push(block);
    totalPicked += block.picked.length;
  }
  return { results, totalPicked };
}

export async function clearMixerSelection(): Promise<void> {
  const db = await ensureDb();
  await db.execute(
    `UPDATE participants SET selected = 0, warnings = 0, status = 'en_course'`
  );
  await updateSettings({ mixerAt: null });
}

export async function getPublicSelection(): Promise<{
  published: boolean;
  participants: Participant[];
}> {
  const settings = await getSettings();
  if (!settings.showDrawn) {
    return { published: false, participants: [] };
  }
  return {
    published: true,
    participants: await listSelectedParticipants(),
  };
}

import { randomUUID } from "node:crypto";
import { DISTRICTS, PICKS_PER_DISTRICT } from "@/lib/districts";
import { bumpRevision, getSupabase } from "@/lib/db";
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

type ParticipantRow = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  id_unique: string;
  district: string;
  registered_at: string;
  selected: boolean;
  warnings: number;
  status: string;
};

function rowToParticipant(row: ParticipantRow): Participant {
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
    selected: Boolean(row.selected),
    warnings,
    status,
  };
}

export async function listParticipants(): Promise<Participant[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("moc_participants")
    .select("*")
    .order("registered_at", { ascending: true });
  if (error) throw error;
  return (data as ParticipantRow[]).map(rowToParticipant);
}

export async function listSelectedParticipants(): Promise<Participant[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("moc_participants")
    .select("*")
    .eq("selected", true)
    .order("district", { ascending: true })
    .order("prenom", { ascending: true });
  if (error) throw error;
  return (data as ParticipantRow[]).map(rowToParticipant);
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
  const sb = getSupabase();

  const { data: dupId } = await sb
    .from("moc_participants")
    .select("id")
    .eq("id_unique", data.idUnique.trim())
    .maybeSingle();
  if (dupId) {
    return { error: "Cet ID unique est déjà utilisé.", status: 409 };
  }

  const { data: dupMat } = await sb
    .from("moc_participants")
    .select("id")
    .eq("matricule", data.matricule.trim())
    .maybeSingle();
  if (dupMat) {
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

  const { error } = await sb.from("moc_participants").insert({
    id: participant.id,
    nom: participant.nom,
    prenom: participant.prenom,
    matricule: participant.matricule,
    id_unique: participant.idUnique,
    district: participant.district,
    registered_at: participant.registeredAt,
    selected: false,
    warnings: 0,
    status: "en_course",
  });

  if (error) {
    return { error: "Conflit d'inscription (doublon).", status: 409 };
  }

  await bumpRevision();
  return { participant };
}

export async function updateParticipantRace(
  id: string,
  patch: { warnings?: number; status?: RaceStatus }
): Promise<{ participant: Participant } | { error: string; status: number }> {
  const sb = getSupabase();
  const { data: row, error } = await sb
    .from("moc_participants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!row) return { error: "Participant introuvable.", status: 404 };

  const existing = rowToParticipant(row as ParticipantRow);
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

  const { error: upErr } = await sb
    .from("moc_participants")
    .update({ warnings, status })
    .eq("id", id);
  if (upErr) throw upErr;

  await bumpRevision();
  return { participant: { ...existing, warnings, status } };
}

export async function deleteParticipant(
  id: string
): Promise<{ ok: true } | { error: string; status: number }> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("moc_participants")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    return { error: "Participant introuvable.", status: 404 };
  }
  await bumpRevision();
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

  const sb = getSupabase();
  const { data, error } = await sb
    .from("moc_participants")
    .select("*")
    .eq("district", districtId);
  if (error) throw error;

  const pool = (data as ParticipantRow[]).map(rowToParticipant);
  const winners = shuffle(pool).slice(0, PICKS_PER_DISTRICT);
  const winnerIds = new Set(winners.map((p) => p.id));

  for (const p of pool) {
    const { error: upErr } = await sb
      .from("moc_participants")
      .update({
        selected: winnerIds.has(p.id),
        warnings: 0,
        status: "en_course",
      })
      .eq("id", p.id);
    if (upErr) throw upErr;
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
  const sb = getSupabase();
  const { error } = await sb
    .from("moc_participants")
    .update({ selected: false, warnings: 0, status: "en_course" })
    .not("id", "is", null);
  if (error) throw error;
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

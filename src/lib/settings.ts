import { bumpRevision, ensureDb } from "@/lib/db";
import type { EventMode, EventSettings } from "@/types/settings";

export type SettingsWithRevision = EventSettings & { revision: number };

function rowToSettings(row: Record<string, unknown>): SettingsWithRevision {
  return {
    mode: row.mode === "closed" ? "closed" : "inscription",
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    mixerAt: row.mixer_at ? String(row.mixer_at) : null,
    showDrawn: Boolean(Number(row.show_drawn ?? 0)),
    revision: Number(row.revision ?? 1),
  };
}

export async function getSettings(): Promise<SettingsWithRevision> {
  const db = await ensureDb();
  const result = await db.execute(`SELECT * FROM settings WHERE id = 1`);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return {
      mode: "inscription",
      updatedAt: new Date().toISOString(),
      mixerAt: null,
      showDrawn: false,
      revision: 1,
    };
  }
  return rowToSettings(row);
}

export async function updateSettings(patch: {
  mode?: EventMode;
  mixerAt?: string | null;
  showDrawn?: boolean;
}): Promise<SettingsWithRevision> {
  const db = await ensureDb();
  const current = await getSettings();
  const next = {
    mode: patch.mode ?? current.mode,
    mixerAt: patch.mixerAt !== undefined ? patch.mixerAt : current.mixerAt,
    showDrawn:
      patch.showDrawn !== undefined ? patch.showDrawn : current.showDrawn,
    updatedAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `UPDATE settings
           SET mode = ?, updated_at = ?, mixer_at = ?, show_drawn = ?
           WHERE id = 1`,
    args: [
      next.mode,
      next.updatedAt,
      next.mixerAt,
      next.showDrawn ? 1 : 0,
    ],
  });

  const revision = await bumpRevision(db);
  return { ...next, revision };
}

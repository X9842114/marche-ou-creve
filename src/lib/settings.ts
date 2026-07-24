import { bumpRevision, getSupabase } from "@/lib/db";
import type { EventMode, EventSettings } from "@/types/settings";

export type SettingsWithRevision = EventSettings & { revision: number };

type SettingsRow = {
  id: number;
  mode: string;
  updated_at: string;
  mixer_at: string | null;
  show_drawn: boolean;
  revision: number;
};

function rowToSettings(row: SettingsRow): SettingsWithRevision {
  return {
    mode: row.mode === "closed" ? "closed" : "inscription",
    updatedAt: row.updated_at || new Date().toISOString(),
    mixerAt: row.mixer_at ?? null,
    showDrawn: Boolean(row.show_drawn),
    revision: Number(row.revision ?? 1),
  };
}

export async function getSettings(): Promise<SettingsWithRevision> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("moc_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return {
      mode: "inscription",
      updatedAt: new Date().toISOString(),
      mixerAt: null,
      showDrawn: false,
      revision: 1,
    };
  }
  return rowToSettings(data as SettingsRow);
}

export async function updateSettings(patch: {
  mode?: EventMode;
  mixerAt?: string | null;
  showDrawn?: boolean;
}): Promise<SettingsWithRevision> {
  const sb = getSupabase();
  const current = await getSettings();
  const next = {
    mode: patch.mode ?? current.mode,
    mixer_at: patch.mixerAt !== undefined ? patch.mixerAt : current.mixerAt,
    show_drawn:
      patch.showDrawn !== undefined ? patch.showDrawn : current.showDrawn,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb.from("moc_settings").update(next).eq("id", 1);
  if (error) throw error;

  const revision = await bumpRevision();
  return {
    mode: next.mode,
    mixerAt: next.mixer_at,
    showDrawn: next.show_drawn,
    updatedAt: next.updated_at,
    revision,
  };
}

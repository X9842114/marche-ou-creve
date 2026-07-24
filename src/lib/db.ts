import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalForSb = globalThis as unknown as {
  __mocSupabase?: SupabaseClient;
};

export function getSupabase(): SupabaseClient {
  if (!globalForSb.__mocSupabase) {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis"
      );
    }
    globalForSb.__mocSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return globalForSb.__mocSupabase;
}

export async function bumpRevision(): Promise<number> {
  const sb = getSupabase();
  const { data: current, error: readErr } = await sb
    .from("moc_settings")
    .select("revision")
    .eq("id", 1)
    .single();
  if (readErr) throw readErr;

  const next = Number(current?.revision ?? 1) + 1;
  const { error } = await sb
    .from("moc_settings")
    .update({
      revision: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw error;
  return next;
}

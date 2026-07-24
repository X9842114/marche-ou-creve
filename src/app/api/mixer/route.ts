import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { districtIds } from "@/lib/districts";
import {
  clearMixerSelection,
  runDistrictMixer,
  runDistrictMixerFor,
} from "@/lib/participants";
import type { DistrictId } from "@/types/participant";

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const raw = body as { action?: unknown; district?: unknown };
  const action = raw.action;

  if (action === "reset") {
    await clearMixerSelection();
    return NextResponse.json({ ok: true });
  }

  if (action === "district") {
    const district = raw.district;
    if (
      typeof district !== "string" ||
      !districtIds.includes(district as DistrictId)
    ) {
      return NextResponse.json({ error: "District invalide" }, { status: 400 });
    }
    const result = await runDistrictMixerFor(district as DistrictId);
    return NextResponse.json({ result });
  }

  if (action === "all" || action === undefined) {
    const data = await runDistrictMixer();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}

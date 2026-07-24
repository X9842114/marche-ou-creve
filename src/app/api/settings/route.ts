import { NextResponse } from "next/server";
import { isAdminRequest, requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { getSettings, updateSettings } from "@/lib/settings";
import type { EventMode } from "@/types/settings";

export async function GET() {
  const settings = await getSettings();
  const admin = await isAdminRequest();
  if (!admin) {
    return NextResponse.json({
      settings: {
        mode: settings.mode,
        showDrawn: settings.showDrawn,
        updatedAt: settings.updatedAt,
        mixerAt: null,
        revision: settings.revision,
      },
    });
  }
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const raw = body as { mode?: unknown; showDrawn?: unknown };
  const patch: { mode?: EventMode; showDrawn?: boolean } = {};

  if (raw.mode === "inscription" || raw.mode === "closed") {
    patch.mode = raw.mode;
  }
  if (typeof raw.showDrawn === "boolean") {
    patch.showDrawn = raw.showDrawn;
  }

  if (patch.mode === undefined && patch.showDrawn === undefined) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const settings = await updateSettings(patch);
  return NextResponse.json({ settings });
}

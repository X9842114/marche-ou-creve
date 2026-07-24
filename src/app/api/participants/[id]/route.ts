import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import {
  deleteParticipant,
  updateParticipantRace,
} from "@/lib/participants";
import { MAX_WARNINGS, type RaceStatus } from "@/types/participant";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const raw = body as { warnings?: unknown; status?: unknown };
  const patch: { warnings?: number; status?: RaceStatus } = {};

  if (typeof raw.warnings === "number") {
    if (
      !Number.isFinite(raw.warnings) ||
      raw.warnings < 0 ||
      raw.warnings > MAX_WARNINGS
    ) {
      return NextResponse.json(
        { error: "Nombre d’avertissements invalide" },
        { status: 400 }
      );
    }
    patch.warnings = Math.floor(raw.warnings);
  }

  if (raw.status === "en_course" || raw.status === "elimine") {
    patch.status = raw.status;
  }

  if (patch.warnings === undefined && patch.status === undefined) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const result = await updateParticipantRace(id, patch);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ participant: result.participant });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const result = await deleteParticipant(id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true });
}

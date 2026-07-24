import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import {
  getPublicSelection,
  listParticipants,
} from "@/lib/participants";
import { getSettings } from "@/lib/settings";

/**
 * Point unique pour synchroniser tous les clients sur la même vérité serveur.
 * ?revision=N → 204 si rien n’a changé (léger pour le polling).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientRev = Number(url.searchParams.get("revision") || "0");
  const settings = await getSettings();
  const admin = await isAdminRequest();

  if (
    Number.isFinite(clientRev) &&
    clientRev > 0 &&
    clientRev === settings.revision
  ) {
    return new NextResponse(null, { status: 204 });
  }

  const selection = await getPublicSelection();

  // Public : jamais la liste complète des inscrits
  const publicSettings = {
    mode: settings.mode,
    showDrawn: settings.showDrawn,
    updatedAt: settings.updatedAt,
    mixerAt: admin ? settings.mixerAt : null,
    revision: settings.revision,
  };

  const payload: {
    revision: number;
    settings: typeof publicSettings;
    selection: typeof selection;
    participants?: Awaited<ReturnType<typeof listParticipants>>;
    isAdmin: boolean;
  } = {
    revision: settings.revision,
    settings: publicSettings,
    selection,
    isAdmin: admin,
  };

  if (admin) {
    payload.participants = await listParticipants();
  }

  return NextResponse.json(payload);
}

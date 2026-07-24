import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { addParticipant, listParticipants } from "@/lib/participants";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { ParticipantInput } from "@/types/participant";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({ participants: await listParticipants() });
}

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const ip = clientIp(request);
  const limited = rateLimit(`register:${ip}`, 8, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop d’inscriptions depuis cette adresse. Attends un peu." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const admin = await isAdminRequest();
  const result = await addParticipant(body as ParticipantInput, {
    allowWhenClosed: admin,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ participant: result.participant }, { status: 201 });
}

import { NextResponse } from "next/server";
import {
  createAdminToken,
  setAdminCookie,
  verifyAdminPassword,
} from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const ip = clientIp(request);
  const limited = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie plus tard." },
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

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!password || password.length > 200) {
    return NextResponse.json(
      { error: "Mot de passe incorrect" },
      { status: 401 }
    );
  }

  try {
    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Configuration serveur invalide" },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  setAdminCookie(res, createAdminToken());
  return res;
}

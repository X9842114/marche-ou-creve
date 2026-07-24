import { NextResponse } from "next/server";

/** Bloque les POST/PATCH/DELETE cross-site (CSRF) pour les routes cookie. */
export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Host manquant" }, { status: 400 });
  }

  // Same-origin navigations / curl sans Origin : OK (same-site)
  if (!origin) return null;

  try {
    const o = new URL(origin);
    const expectedHost = host.split(",")[0]?.trim().toLowerCase();
    if (o.host.toLowerCase() !== expectedHost) {
      return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
  }

  return null;
}

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "moc_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_PASSWORD manquant en production");
    }
    return "admin";
  }
  return password;
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_SECRET manquant en production");
    }
    return "dev-only-secret-change-me";
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getAdminSecret())
    .update(payload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  try {
    const a = createHmac("sha256", getAdminSecret())
      .update(`pwd:${password}`)
      .digest();
    const b = createHmac("sha256", getAdminSecret())
      .update(`pwd:${expected}`)
      .digest();
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createAdminToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `v1.${exp}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const [, expStr, nonce, sig] = parts;
  if (!expStr || !nonce || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `v1.${expStr}.${nonce}`;
  return safeEqual(sig, sign(payload));
}

export async function isAdminRequest(): Promise<boolean> {
  try {
    const jar = await cookies();
    return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

export function setAdminCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  if (await isAdminRequest()) return { ok: true };
  return {
    ok: false,
    response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }),
  };
}

import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}

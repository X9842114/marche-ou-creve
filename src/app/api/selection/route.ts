import { NextResponse } from "next/server";
import { getPublicSelection } from "@/lib/participants";

export async function GET() {
  return NextResponse.json(await getPublicSelection());
}

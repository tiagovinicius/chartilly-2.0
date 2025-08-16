import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code } = body as { code?: string };
  if (!code) return NextResponse.json({ ok: false, error: "missing code" }, { status: 400 });
  // TODO: exchange with Spotify for tokens and persist
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "mock-session", { httpOnly: false, path: "/", maxAge: 60*60*24*7 });
  return res;
}

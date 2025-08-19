import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "missing_lastfm_api_key" }, { status: 500 });
  }
  const origin = req.nextUrl.origin;
  const next = req.nextUrl.searchParams.get("next") || "/charts";
  const cbEnv = process.env.LASTFM_REDIRECT_URI;
  const callbackUrl = cbEnv || `${origin}/api/auth/lastfm/callback`;

  const cb = new URL(callbackUrl);
  if (next) cb.searchParams.set("next", next);

  const authUrl = new URL("https://www.last.fm/api/auth/");
  authUrl.searchParams.set("api_key", apiKey);
  authUrl.searchParams.set("cb", cb.toString());

  return NextResponse.redirect(authUrl.toString());
}

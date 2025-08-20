import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");
  const nextParam = req.nextUrl.searchParams.get("next") || "/";
  const nextPath = nextParam.startsWith("/") ? nextParam : "/";
  if (!token) return NextResponse.redirect(new URL("/connect/lastfm?error=missing_token", origin));

  const apiKey = process.env.LASTFM_API_KEY!;
  const apiSecret = process.env.LASTFM_API_SECRET!;
  if (!apiKey || !apiSecret) return NextResponse.redirect(new URL("/connect/lastfm?error=missing_api_creds", origin));

  // Compute api_sig = md5("api_key"+API_KEY+"methodauth.getSession"+"token"+TOKEN+API_SECRET)
  const sigBase = `api_key${apiKey}methodauth.getSessiontoken${token}${apiSecret}`;
  const apiSig = crypto.createHash("md5").update(sigBase).digest("hex");

  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("method", "auth.getSession");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("token", token);
  url.searchParams.set("api_sig", apiSig);
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return NextResponse.redirect(new URL(`/connect/lastfm?error=lastfm_http_${res.status}`, origin));
  const data: any = await res.json();
  const sessionKey = data?.session?.key as string | undefined;
  const username = data?.session?.name as string | undefined;
  if (!sessionKey || !username) return NextResponse.redirect(new URL(`/connect/lastfm?error=invalid_session`, origin));

  const ownerSpotifyId = req.cookies.get("session")?.value ?? null;
  if (!ownerSpotifyId) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(nextPath)}`, origin));

  const { data: user } = await supabase
    .from("users")
    .select("user_id")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (!user?.user_id) return NextResponse.redirect(new URL(`/connect/lastfm?error=user_not_found`, origin));

  await supabaseAdmin
    .from("users")
    .update({ lastfm_session_key: sessionKey, lastfm_username: username, updated_at: new Date().toISOString() })
    .eq("user_id", user.user_id);

  return NextResponse.redirect(new URL(nextPath, origin));
}

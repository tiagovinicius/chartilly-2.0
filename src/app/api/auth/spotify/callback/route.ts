import { NextRequest, NextResponse } from "next/server";
import { SpotifyAPI } from "@/lib/spotify-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = req.nextUrl.origin;
  const nextParam = url.searchParams.get("next") || "/";
  const nextPath = nextParam.startsWith("/") ? nextParam : "/";
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", origin));

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  try {
    const token = await SpotifyAPI.exchangeCodeForToken(code, redirectUri, clientId, clientSecret);
    const profile = await SpotifyAPI.getCurrentUserProfile(token);

    // Get or create user without changing primary key if exists
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("users")
      .select("user_id, spotify_user_id")
      .eq("spotify_user_id", profile.id)
      .single();
    if (selErr && selErr.code !== "PGRST116") throw selErr; // ignore no rows

    let spotifyUserId = profile.id;
    if (existing?.user_id) {
      const { error: updErr } = await supabaseAdmin
        .from("users")
        .update({
          email: profile.email ?? null,
          spotify_access_token: token.access_token,
          spotify_refresh_token: token.refresh_token ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", existing.user_id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabaseAdmin
        .from("users")
        .insert({
          user_id: crypto.randomUUID(),
          email: profile.email ?? null,
          spotify_access_token: token.access_token,
          spotify_refresh_token: token.refresh_token ?? null,
          spotify_user_id: profile.id,
          updated_at: new Date().toISOString(),
        });
      if (insErr) throw insErr;
    }

    // Check if user already connected Last.fm
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("lastfm_session_key")
      .eq("spotify_user_id", profile.id)
      .single();

    // simple session cookie: spotify_user_id; in real app use proper session
    const redirectUrl = userRow?.lastfm_session_key
      ? new URL(nextPath, origin)
      : new URL(`/connect/lastfm?next=${encodeURIComponent("/")}`, origin);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set("session", spotifyUserId, { httpOnly: false, path: "/", maxAge: 60*60*24*7 });
    return res;
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(e.message ?? "auth_failed")}`, origin));
  }
}

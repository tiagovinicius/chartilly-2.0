import { NextRequest, NextResponse } from "next/server";
import { SpotifyAPI } from "@/lib/spotify-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = req.nextUrl.origin;
  const nextParam = url.searchParams.get("next") || "/playlists";
  const nextPath = nextParam.startsWith("/") ? nextParam : "/playlists";
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", origin));

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  try {
    const token = await SpotifyAPI.exchangeCodeForToken(code, redirectUri, clientId, clientSecret);
    const profile = await SpotifyAPI.getCurrentUserProfile(token);

    // upsert user in Supabase
    const { data: upserted, error } = await supabaseAdmin
      .from("users")
      .upsert({
        user_id: crypto.randomUUID(),
        email: profile.email ?? null,
        spotify_access_token: token.access_token,
        spotify_refresh_token: token.refresh_token ?? null,
        spotify_user_id: profile.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "spotify_user_id" })
      .select("user_id, spotify_user_id")
      .single();
    if (error) throw error;

    // simple session cookie: spotify_user_id; in real app use proper session
    const res = NextResponse.redirect(new URL(nextPath, origin));
    res.cookies.set("session", upserted.spotify_user_id, { httpOnly: false, path: "/", maxAge: 60*60*24*7 });
    return res;
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(e.message ?? "auth_failed")}`, origin));
  }
}

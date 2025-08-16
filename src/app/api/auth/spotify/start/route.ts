import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const scopes = [
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-email"
  ].join(" ");
  if (!clientId || !redirectUri) {
    return NextResponse.json({ ok:false, error: "Missing SPOTIFY_CLIENT_ID / SPOTIFY_REDIRECT_URI" }, { status: 500 });
  }
  const state = Math.random().toString(36).slice(2);
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString());
}

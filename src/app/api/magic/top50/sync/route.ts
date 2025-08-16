import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SpotifyAPI } from "@/lib/spotify-sdk";
import { performTop50Sync } from "@/lib/top50-sync";

export async function POST(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value ?? null;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { playlistId, playlistName, playlistDescription, savePreference } = await req.json().catch(() => ({}));

  const { data: userRow } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, spotify_refresh_token, lastfm_session_key, lastfm_username, top50_playlist_id, top50_playlist_name")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (!userRow?.spotify_access_token || !userRow?.user_id) return Response.json({ ok: false, error: "no_token" }, { status: 401 });
  if (!userRow.lastfm_username) return Response.json({ ok: false, error: "missing_lastfm_username" }, { status: 400 });

  const userId = userRow.user_id as string;
  const accessToken0 = userRow.spotify_access_token as string;
  const refreshToken = userRow.spotify_refresh_token as string | undefined;
  const lastfmUsername = userRow.lastfm_username as string;

  // Default to saved preference if no override passed
  const effectivePlaylistId = (playlistId as string | undefined) ?? (userRow.top50_playlist_id as string | undefined) ?? undefined;
  const effectivePlaylistName = (playlistName as string | undefined) ?? (userRow.top50_playlist_name as string | undefined) ?? undefined;

  async function doSync(accessToken: string) {
    const result = await performTop50Sync({
      spotifyAccessToken: accessToken,
      ownerSpotifyId: ownerSpotifyId as string,
      userId,
      lastfmUsername,
      playlistId: effectivePlaylistId,
      playlistName: effectivePlaylistName,
      playlistDescription,
    });

    // Persist preference: if user provided a target in this request OR opted-in OR had no pref yet, save it
    const hadPref = !!(userRow!.top50_playlist_id || userRow!.top50_playlist_name);
    const providedNewTarget = typeof playlistId === 'string' || typeof playlistName === 'string';
    const shouldSave = providedNewTarget || savePreference === true || !hadPref;
    if (shouldSave) {
      await supabaseAdmin
        .from("users")
        .update({ top50_playlist_id: result.playlistId, top50_playlist_name: effectivePlaylistName ?? null, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return result;
  }

  try {
    const result = await doSync(accessToken0);
    return Response.json({ ok: true, ...result });
  } catch (e: any) {
    if (!refreshToken) return Response.json({ ok: false, error: e.message ?? "sync_failed" }, { status: 500 });
    try {
      const refreshed = await SpotifyAPI.refreshAccessToken(refreshToken, process.env.SPOTIFY_CLIENT_ID!, process.env.SPOTIFY_CLIENT_SECRET!);
      const newRefresh = refreshed.refresh_token ?? refreshToken;
      await supabaseAdmin
        .from("users")
        .update({ spotify_access_token: refreshed.access_token, spotify_refresh_token: newRefresh, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      const result = await doSync(refreshed.access_token);
      return Response.json({ ok: true, refreshed: true, ...result });
    } catch (e2: any) {
      await supabaseAdmin.from("events").insert({ user_id: userId, event_type: "top50_sync", status: "fail", payload: { error: e2?.message ?? "sync_failed" } });
      return Response.json({ ok: false, error: e2.message ?? "sync_failed" }, { status: 500 });
    }
  }
}

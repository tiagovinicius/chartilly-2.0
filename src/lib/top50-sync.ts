import { supabaseAdmin } from "@/lib/supabase-admin";
import { LastFmAPI } from "@/lib/lastfm-sdk";
import { SpotifyAPI, type SpotifyTelemetry } from "@/lib/spotify-sdk";

export async function performTop50Sync(params: {
  spotifyAccessToken: string;
  ownerSpotifyId: string; // Spotify user id (for creating playlist)
  userId: string; // UUID in our DB
  lastfmUsername: string;
  // new options for target playlist
  playlistId?: string; // if provided, use this existing playlist
  playlistName?: string; // else, find-or-create by name
  playlistDescription?: string;
}): Promise<{ count: number; playlistId: string; telemetry: SpotifyTelemetry }>{
  const { spotifyAccessToken, ownerSpotifyId, userId, lastfmUsername, playlistId, playlistName, playlistDescription } = params;
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("missing_lastfm_api_key");

  const token = { access_token: spotifyAccessToken } as const;
  const tracks = await LastFmAPI.getWeeklyTop50(lastfmUsername, apiKey);

  const uris: string[] = [];
  const stats: SpotifyTelemetry = { totalRequests: 0, retries: 0, rateLimited: 0 };
  for (const t of tracks) {
    const uri = await SpotifyAPI.searchTrackUri(token, t.artist, t.title, stats);
    if (uri) uris.push(uri);
  }

  // choose playlist target
  let targetPlaylistId: string;
  if (playlistId) {
    targetPlaylistId = playlistId;
  } else {
    const provided = (playlistName ?? "").trim();
    const name = provided.length > 0 ? provided : "Chartilly Top of the Week";
    targetPlaylistId = await SpotifyAPI.getOrCreatePlaylistByName(
      token,
      ownerSpotifyId,
      name,
      playlistDescription ?? "Atualizado pelo Chartilly"
    );
  }

  await supabaseAdmin.from("charts_top50").upsert({ user_id: userId, track_ids: uris, generated_at: new Date().toISOString() });
  await SpotifyAPI.replacePlaylistTracks(token, targetPlaylistId, uris);
  await supabaseAdmin.from("events").insert({ user_id: userId, event_type: "top50_sync", status: "ok", payload: { count: uris.length, telemetry: stats, targetPlaylistId } });

  return { count: uris.length, playlistId: targetPlaylistId, telemetry: stats };
}

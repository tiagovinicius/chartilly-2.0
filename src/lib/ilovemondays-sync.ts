import { supabaseAdmin } from "@/lib/supabase-admin";
import { LastFmAPI } from "@/lib/lastfm-sdk";
import { SpotifyAPI, type SpotifyTelemetry } from "@/lib/spotify-sdk";

export async function performILoveMondaysSync(params: {
  spotifyAccessToken: string;
  ownerSpotifyId: string; // Spotify user id (for creating playlist)
  userId: string; // UUID in our DB
  lastfmUsername: string;
  // new options for target playlist
  playlistId?: string; // if provided, use this existing playlist
  playlistName?: string; // else, find-or-create by name
  playlistDescription?: string;
}): Promise<{ count: number; playlistId: string; telemetry: SpotifyTelemetry; weekStartDate: string }>{
  const { spotifyAccessToken, ownerSpotifyId, userId, lastfmUsername, playlistId, playlistName, playlistDescription } = params;
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("missing_lastfm_api_key");

  const token = { access_token: spotifyAccessToken } as const;
  const tracks = await LastFmAPI.getILoveMondaysTop100(lastfmUsername, apiKey);

  const uris: string[] = [];
  const stats: SpotifyTelemetry = { totalRequests: 0, retries: 0, rateLimited: 0 };
  for (const t of tracks) {
    const uri = await SpotifyAPI.searchTrackUri(token, t.artist, t.title, stats);
    if (uri) uris.push(uri);
  }

  // Calculate Monday of the current tracking week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysFromMonday - 7);
  lastMonday.setHours(0, 0, 0, 0);
  const weekStartDate = lastMonday.toISOString().split('T')[0]; // YYYY-MM-DD format

  // choose playlist target
  let targetPlaylistId: string;
  if (playlistId) {
    targetPlaylistId = playlistId;
  } else {
    const provided = (playlistName ?? "").trim();
    const name = provided.length > 0 ? provided : "Chartilly I Love Mondays";
    targetPlaylistId = await SpotifyAPI.getOrCreatePlaylistByName(
      token,
      ownerSpotifyId,
      name,
      playlistDescription ?? "Top 100 songs since Monday - Updated by Chartilly"
    );
  }

  await supabaseAdmin.from("charts_ilovemondays").upsert({
    user_id: userId,
    track_ids: uris,
    generated_at: new Date().toISOString(),
    week_start_date: weekStartDate
  });
  await SpotifyAPI.replacePlaylistTracks(token, targetPlaylistId, uris);
  await supabaseAdmin.from("events").insert({
    user_id: userId,
    event_type: "ilovemondays_sync",
    status: "ok",
    payload: { count: uris.length, telemetry: stats, targetPlaylistId, weekStartDate }
  });

  return { count: uris.length, playlistId: targetPlaylistId, telemetry: stats, weekStartDate };
}

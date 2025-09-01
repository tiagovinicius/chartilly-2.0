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
  console.log(`Fetching weekly top 100 tracks for user: ${lastfmUsername}`);
  const tracks = await LastFmAPI.getWeeklyTop100(lastfmUsername, apiKey);
  console.log(`Last.fm returned ${tracks.length} tracks`);

  const uris: string[] = [];
  const stats: SpotifyTelemetry = { totalRequests: 0, retries: 0, rateLimited: 0 };

  // Process tracks in parallel batches to speed up the sync
  const BATCH_SIZE = 10; // Process 10 tracks at once
  const batches: typeof tracks[] = [];
  for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
    batches.push(tracks.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${tracks.length} tracks in ${batches.length} batches of ${BATCH_SIZE}`);

  let cacheHits = 0;
  let cacheMisses = 0;

  for (const batch of batches) {
    const batchPromises = batch.map(async (t) => {
      try {
        const initialRequests = stats.totalRequests;
        const uri = await SpotifyAPI.searchTrackUri(token, t.artist, t.title, stats);

        // Track cache performance: if totalRequests didn't increase, it was a cache hit
        if (stats.totalRequests === initialRequests) {
          cacheHits++;
        } else {
          cacheMisses++;
        }

        return uri;
      } catch (error) {
        console.warn(`Failed to search for ${t.artist} - ${t.title}:`, error);
        cacheMisses++;
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    for (const uri of batchResults) {
      if (uri) uris.push(uri);
    }
  }

  const cacheHitRate = tracks.length > 0 ? ((cacheHits / tracks.length) * 100).toFixed(1) : '0.0';
  console.log(`Found ${uris.length} Spotify URIs out of ${tracks.length} Last.fm tracks`);
  console.log(`Cache performance: ${cacheHits} hits, ${cacheMisses} misses (${cacheHitRate}% hit rate)`);
  console.log(`Spotify API calls saved: ${cacheHits} (${stats.totalRequests} actual calls made)`);

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

    // Persist the chart data in Supabase
  await supabaseAdmin.from("charts_top50").upsert({ user_id: userId, track_ids: uris, generated_at: new Date().toISOString() });
  await SpotifyAPI.replacePlaylistTracks(token, targetPlaylistId, uris);
  await supabaseAdmin.from("events").insert({ user_id: userId, event_type: "top50_sync", status: "ok", payload: { count: uris.length, telemetry: stats, targetPlaylistId } });

  return { count: uris.length, playlistId: targetPlaylistId, telemetry: stats };
}

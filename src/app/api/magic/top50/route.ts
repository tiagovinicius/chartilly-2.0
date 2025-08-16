import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { SpotifyAPI } from "@/lib/spotify-sdk";

export async function GET(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ tracks: [], updatedAt: null }, { status: 401 });

  const { data: user } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, top50_playlist_id, top50_playlist_name")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (!user?.user_id) return Response.json({ tracks: [], updatedAt: null }, { status: 200 });

  const { data: snap } = await supabase
    .from("magic_top50")
    .select("track_ids, generated_at")
    .eq("user_id", user.user_id)
    .single();

  let target: any = { id: user.top50_playlist_id ?? null, name: user.top50_playlist_name ?? null };
  if (user.top50_playlist_id && user.spotify_access_token) {
    try {
      const meta = await SpotifyAPI.getPlaylistMeta({ access_token: user.spotify_access_token }, user.top50_playlist_id);
      target = { id: meta.id, name: meta.name, imageUrl: meta.imageUrl, externalUrl: meta.externalUrl };
    } catch {}
  }

  // Enrich track IDs to metadata if we have a token
  let tracksOut: any = snap?.track_ids ?? [];
  if (Array.isArray(snap?.track_ids) && user.spotify_access_token && (snap.track_ids as string[]).length > 0) {
    try {
      // Convert spotify:track:ID -> ID or accept raw IDs
      const ids = (snap.track_ids as string[]).map((s) => {
        if (!s) return s;
        const parts = s.split(":");
        return parts.length === 3 ? parts[2] : s;
      });
      const meta = await SpotifyAPI.getTracksMeta({ access_token: user.spotify_access_token }, ids);
      tracksOut = meta.map((t) => ({
        id: t.id,
        name: t.name,
        artists: t.artists,
        albumImageUrl: t.albumImageUrl,
      }));
    } catch {
      // fallback to raw ids on error
      tracksOut = snap?.track_ids ?? [];
    }
  }

  return Response.json({
    tracks: tracksOut,
    updatedAt: (snap?.generated_at ?? null) as string | null,
    target,
  });
}

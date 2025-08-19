import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SpotifyAPI } from "@/lib/spotify-sdk";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: user } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, spotify_refresh_token")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();

  if (!user?.spotify_access_token) return Response.json({ ok: false, error: "missing_spotify_token" }, { status: 400 });

  const { id } = params;

  async function load(accessToken: string) {
    const meta = await SpotifyAPI.getPlaylistMeta({ access_token: accessToken }, id);
    const uris = await SpotifyAPI.getPlaylistTracks({ access_token: accessToken }, id);
    const ids = uris.filter(u => typeof u === 'string' && u.startsWith('spotify:track:')).map(u => u.split(':')[2]);
    const enriched = await SpotifyAPI.getTracksMeta({ access_token: accessToken }, ids);
    return { meta, tracks: enriched };
  }

  try {
    const { meta, tracks } = await load(user.spotify_access_token);
    await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "playlist_detail", status: "ok", payload: { id } });
    return Response.json({ ok: true, meta, tracks });
  } catch (e: any) {
    if (!user.spotify_refresh_token) return Response.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
    try {
      const refreshed = await SpotifyAPI.refreshAccessToken(user.spotify_refresh_token, process.env.SPOTIFY_CLIENT_ID!, process.env.SPOTIFY_CLIENT_SECRET!);
      const { meta, tracks } = await load(refreshed.access_token);
      const newRefresh = refreshed.refresh_token ?? user.spotify_refresh_token;
      await supabaseAdmin
        .from("users")
        .update({ spotify_access_token: refreshed.access_token, spotify_refresh_token: newRefresh, updated_at: new Date().toISOString() })
        .eq("user_id", user.user_id);
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "token_refresh", status: "ok" });
      return Response.json({ ok: true, meta, tracks });
    } catch (e2: any) {
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "token_refresh", status: "fail", payload: { error: e2?.message ?? "refresh_failed" } });
      return Response.json({ ok: false, error: "refresh_failed" }, { status: 500 });
    }
  }
}

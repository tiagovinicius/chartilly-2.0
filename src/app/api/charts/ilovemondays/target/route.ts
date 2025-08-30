import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SpotifyAPI } from "@/lib/spotify-sdk";

export async function POST(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value ?? null;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let { playlistId, playlistName } = body as { playlistId?: string; playlistName?: string };
  playlistName = (playlistName ?? "").trim();
  if (!playlistId && !playlistName) {
    return Response.json({ ok: false, error: "missing_target" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("user_id, spotify_access_token")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (!user?.user_id) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  const updates: any = { updated_at: new Date().toISOString() };
  if (playlistId) {
    updates.ilovemondays_playlist_id = playlistId;
    updates.ilovemondays_playlist_name = null;
  } else {
    updates.ilovemondays_playlist_id = null;
    updates.ilovemondays_playlist_name = playlistName || "I Love Mondays";
  }

  await supabaseAdmin.from("users").update(updates).eq("user_id", user.user_id);

  // Build target response, optionally enrich with meta
  let target: any = { id: updates.ilovemondays_playlist_id ?? null, name: updates.ilovemondays_playlist_name ?? null };
  if (updates.ilovemondays_playlist_id && user.spotify_access_token) {
    try {
      const meta = await SpotifyAPI.getPlaylistMeta({ access_token: user.spotify_access_token }, updates.ilovemondays_playlist_id);
      target = { id: meta.id, name: meta.name, imageUrl: meta.imageUrl, externalUrl: meta.externalUrl };
    } catch {}
  }

  return Response.json({ ok: true, target });
}

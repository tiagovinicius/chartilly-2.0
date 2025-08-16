import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SpotifyAPI } from "@/lib/spotify-sdk";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getValidAccessToken(ownerId: string): Promise<{ access: string; userId: string; refresh?: string }> {
  const { data: user } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, spotify_refresh_token")
    .eq("spotify_user_id", ownerId)
    .single();
  if (!user?.spotify_access_token) throw new Error("no_token");
  return { access: user.spotify_access_token as string, userId: user.user_id as string, refresh: user.spotify_refresh_token as string | undefined };
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const playlistId = params.id;
  if (!playlistId) return Response.json({ ok: false, error: "missing id" }, { status: 400 });

  const ownerId = _req.cookies.get("session")?.value;
  if (!ownerId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    let { access, userId, refresh } = await getValidAccessToken(ownerId);
    try {
      // try operations with current token
      const token = { access_token: access } as const;
      const uris = await SpotifyAPI.getPlaylistTracks(token, playlistId);
      if (uris.length === 0) return Response.json({ ok: false, error: "empty_playlist" }, { status: 400 });
      const newOrder = shuffle(uris);
      const { error: insErr } = await supabase.from("shuffle_versions").insert({ playlist_id: playlistId, order_ids: newOrder });
      if (insErr) throw insErr;
      const { data: versions } = await supabase
        .from("shuffle_versions")
        .select("id")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false })
        .range(5, 1000);
      if (versions && versions.length > 0) {
        const idsToDelete = versions.map(v => v.id);
        await supabase.from("shuffle_versions").delete().in("id", idsToDelete);
      }
      await SpotifyAPI.replacePlaylistTracks(token, playlistId, newOrder);
      await supabaseAdmin.from("events").insert({ user_id: userId, event_type: "shuffle", status: "ok", payload: { playlistId, count: newOrder.length } });
      return Response.json({ ok: true, playlistId, count: newOrder.length });
    } catch (e: any) {
      // attempt refresh then retry once
      if (!refresh) throw e;
      const refreshed = await SpotifyAPI.refreshAccessToken(refresh, process.env.SPOTIFY_CLIENT_ID!, process.env.SPOTIFY_CLIENT_SECRET!);
      const newRefresh = refreshed.refresh_token ?? refresh;
      await supabaseAdmin
        .from("users")
        .update({ spotify_access_token: refreshed.access_token, spotify_refresh_token: newRefresh, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      await supabaseAdmin.from("events").insert({ user_id: userId, event_type: "token_refresh", status: "ok" });

      const token = { access_token: refreshed.access_token } as const;
      const uris = await SpotifyAPI.getPlaylistTracks(token, playlistId);
      if (uris.length === 0) return Response.json({ ok: false, error: "empty_playlist" }, { status: 400 });
      const newOrder = shuffle(uris);
      const { error: insErr2 } = await supabase.from("shuffle_versions").insert({ playlist_id: playlistId, order_ids: newOrder });
      if (insErr2) throw insErr2;
      const { data: versions2 } = await supabase
        .from("shuffle_versions")
        .select("id")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false })
        .range(5, 1000);
      if (versions2 && versions2.length > 0) {
        const idsToDelete = versions2.map(v => v.id);
        await supabase.from("shuffle_versions").delete().in("id", idsToDelete);
      }
      await SpotifyAPI.replacePlaylistTracks(token, playlistId, newOrder);
      await supabaseAdmin.from("events").insert({ user_id: userId, event_type: "shuffle", status: "ok", payload: { playlistId, count: newOrder.length, refreshed: true } });
      return Response.json({ ok: true, playlistId, count: newOrder.length });
    }
  } catch (e: any) {
    // log fail
    await supabaseAdmin.from("events").insert({ event_type: "shuffle", status: "fail", payload: { playlistId, error: e?.message ?? "shuffle_failed" } });
    return Response.json({ ok: false, error: e.message ?? "shuffle_failed" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SpotifyAPI } from "@/lib/spotify-sdk";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const playlistId = params.id;
  if (!playlistId) return Response.json({ ok: false, error: "missing id" }, { status: 400 });

  const ownerId = _req.cookies.get("session")?.value;
  if (!ownerId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // fetch tokens
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, spotify_refresh_token")
    .eq("spotify_user_id", ownerId)
    .single();
  if (userErr || !user?.spotify_access_token) return Response.json({ ok: false, error: "no_token" }, { status: 401 });

  async function applyRollback(accessToken: string) {
    const token = { access_token: accessToken } as const;
    const { data: versions, error } = await supabase
      .from("shuffle_versions")
      .select("id, order_ids")
      .eq("playlist_id", playlistId)
      .order("created_at", { ascending: false })
      .limit(2);
    if (error) throw error;
    if (!versions || versions.length < 2) throw new Error("no_previous_version");
    const [latest, previous] = versions;
    await supabase.from("shuffle_versions").delete().eq("id", latest.id);
    await SpotifyAPI.replacePlaylistTracks(token, playlistId, previous.order_ids as unknown as string[]);
  }

  try {
    // try with existing access token
    await applyRollback(user.spotify_access_token);
    await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "rollback", status: "ok", payload: { playlistId } });
    return Response.json({ ok: true, playlistId });
  } catch (e: any) {
    // refresh and retry once if possible
    if (!user.spotify_refresh_token) {
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "rollback", status: "fail", payload: { playlistId, error: e?.message ?? "rollback_failed" } });
      return Response.json({ ok: false, error: e.message ?? "rollback_failed" }, { status: 500 });
    }
    try {
      const refreshed = await SpotifyAPI.refreshAccessToken(user.spotify_refresh_token, process.env.SPOTIFY_CLIENT_ID!, process.env.SPOTIFY_CLIENT_SECRET!);
      const newRefresh = refreshed.refresh_token ?? user.spotify_refresh_token;
      await supabaseAdmin
        .from("users")
        .update({ spotify_access_token: refreshed.access_token, spotify_refresh_token: newRefresh, updated_at: new Date().toISOString() })
        .eq("user_id", user.user_id);
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "token_refresh", status: "ok" });

      await applyRollback(refreshed.access_token);
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "rollback", status: "ok", payload: { playlistId, refreshed: true } });
      return Response.json({ ok: true, playlistId });
    } catch (e2: any) {
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "rollback", status: "fail", payload: { playlistId, error: e2?.message ?? "rollback_failed_after_refresh" } });
      return Response.json({ ok: false, error: e2.message ?? "rollback_failed" }, { status: 500 });
    }
  }
}

import { NextRequest } from "next/server";
import { SpotifyAPI } from "@/lib/spotify-sdk";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ playlists: [], error: "unauthorized" }, { status: 401 });

  // read user with tokens
  const { data: user, error } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, spotify_refresh_token")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (error || !user?.spotify_access_token) {
    // log fail
    await supabaseAdmin.from("events").insert({
      user_id: user?.user_id ?? null,
      event_type: "list_playlists",
      status: "fail",
      payload: { reason: "no_token" }
    });
    return Response.json({ playlists: [], error: "no_token" }, { status: 401 });
  }

  try {
    const playlists = await SpotifyAPI.listUserPlaylists({ access_token: user.spotify_access_token }, ownerSpotifyId);
    // log ok
    await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "list_playlists", status: "ok", payload: { count: playlists.length } });
    return Response.json({ playlists });
  } catch (e: any) {
    // try refresh
    if (!user.spotify_refresh_token) {
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "list_playlists", status: "fail", payload: { error: e?.message ?? "list_failed_no_refresh" } });
      return Response.json({ playlists: [], error: "list_failed" }, { status: 500 });
    }
    try {
      const refreshed = await SpotifyAPI.refreshAccessToken(user.spotify_refresh_token, process.env.SPOTIFY_CLIENT_ID!, process.env.SPOTIFY_CLIENT_SECRET!);
      // preserve old refresh_token when not returned
      const newRefresh = refreshed.refresh_token ?? user.spotify_refresh_token;
      await supabaseAdmin
        .from("users")
        .update({ spotify_access_token: refreshed.access_token, spotify_refresh_token: newRefresh, updated_at: new Date().toISOString() })
        .eq("user_id", user.user_id);
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "token_refresh", status: "ok" });

      const playlists = await SpotifyAPI.listUserPlaylists({ access_token: refreshed.access_token }, ownerSpotifyId);
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "list_playlists", status: "ok", payload: { count: playlists.length } });
      return Response.json({ playlists });
    } catch (e2: any) {
      await supabaseAdmin.from("events").insert({ user_id: user.user_id, event_type: "token_refresh", status: "fail", payload: { error: e2?.message ?? "refresh_failed" } });
      return Response.json({ playlists: [], error: "refresh_failed" }, { status: 500 });
    }
  }
}

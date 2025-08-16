import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: user } = await supabase
    .from("users")
    .select("user_id, lastfm_username")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (!user?.user_id) return Response.json({ ok: false, error: "user_not_found" }, { status: 404 });
  return Response.json({ ok: true, connected: !!user.lastfm_username, username: user.lastfm_username ?? null });
}

export async function DELETE(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: user } = await supabase
    .from("users")
    .select("user_id")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();
  if (!user?.user_id) return Response.json({ ok: false, error: "user_not_found" }, { status: 404 });
  await supabaseAdmin
    .from("users")
    .update({ lastfm_session_key: null, lastfm_username: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.user_id);
  return Response.json({ ok: true });
}

// Legacy POST manual flow is deprecated; use /api/auth/lastfm/start to connect via OAuth.

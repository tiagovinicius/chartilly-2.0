import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(req: NextRequest) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  
  const debugInfo = {
    sessionCookie: ownerSpotifyId || null,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get("user-agent"),
    cookies: Object.fromEntries(
      req.cookies.getAll().map(cookie => [cookie.name, cookie.value])
    )
  };

  if (!ownerSpotifyId) {
    return Response.json({
      error: "no_session_cookie",
      debug: debugInfo
    }, { status: 401 });
  }

  // Check user in database
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, spotify_access_token, spotify_refresh_token, spotify_user_id, lastfm_username, created_at, updated_at")
      .eq("spotify_user_id", ownerSpotifyId)
      .single();

    if (error) {
      return Response.json({
        error: "user_query_failed",
        details: error.message,
        debug: debugInfo
      }, { status: 500 });
    }

    if (!user) {
      return Response.json({
        error: "user_not_found",
        debug: debugInfo
      }, { status: 404 });
    }

    const userInfo = {
      user_id: user.user_id,
      spotify_user_id: user.spotify_user_id,
      has_spotify_token: !!user.spotify_access_token,
      has_refresh_token: !!user.spotify_refresh_token,
      has_lastfm: !!user.lastfm_username,
      created_at: user.created_at,
      updated_at: user.updated_at,
      token_preview: user.spotify_access_token ? 
        `${user.spotify_access_token.substring(0, 20)}...` : null
    };

    return Response.json({
      status: "authenticated",
      user: userInfo,
      debug: debugInfo
    });

  } catch (error: any) {
    return Response.json({
      error: "debug_failed",
      details: error.message,
      debug: debugInfo
    }, { status: 500 });
  }
}

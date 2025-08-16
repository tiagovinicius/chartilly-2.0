import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { SpotifyAPI } from "@/lib/spotify-sdk";

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: user } = await supabase
    .from("users")
    .select("user_id, spotify_access_token, lastfm_username")
    .eq("spotify_user_id", ownerSpotifyId)
    .single();

  if (!user?.spotify_access_token) return Response.json({ ok: false, error: "missing_spotify_token" }, { status: 400 });

  const { id } = await params;
  try {
    // Spotify track data
    const meta = await SpotifyAPI.getTracksMeta({ access_token: user.spotify_access_token }, [id]);
    const t = meta[0];
    if (!t) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

    const title = t.name;
    const artists = t.artists;
    const albumName = t.albumName;
    const albumImageUrl = t.albumImageUrl;

    // Last.fm info for track and album
    const apiKey = process.env.LASTFM_API_KEY;
  let trackWiki: string | null = null;
  let albumWiki: string | null = null;
  let artistWiki: string | null = null;
    // very small sanitizer: allow a subset and strip everything else
    const sanitize = (html: string | null | undefined) => {
      if (!html || typeof html !== 'string') return null;
      // remove script/style tags and their content
      html = html.replace(/<\/(?:script|style)>/gi, '').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
      // remove on* attributes and javascript: urls
      html = html.replace(/ on[a-z]+="[^"]*"/gi, '');
      html = html.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
      // Whitelist basic tags: b, i, em, strong, p, br, a
      // Strip other tags but keep inner text
      html = html.replace(/<(?!\/?(b|i|em|strong|p|br|a)\b)[^>]+>/gi, '');
      // For anchors, keep href if it's http(s) and add rel attrs
      html = html.replace(/<a ([^>]*href=)"(.*?)"([^>]*)>/gi, (m, pre, url, post) => {
        if (!/^https?:\/\//i.test(url)) return '<a>';
        return `<a href="${url}" target="_blank" rel="nofollow noreferrer noopener">`;
      });
      return html;
    };
    if (apiKey) {
      try {
        const urlTrack = new URL(LASTFM_API);
        urlTrack.searchParams.set("method", "track.getInfo");
        urlTrack.searchParams.set("api_key", apiKey);
        urlTrack.searchParams.set("format", "json");
        urlTrack.searchParams.set("track", title);
        if (artists[0]) urlTrack.searchParams.set("artist", artists[0]);
        const r1 = await fetch(urlTrack.toString());
        if (r1.ok) {
          const j1: any = await r1.json();
          trackWiki = sanitize(j1?.track?.wiki?.summary);
        }
      } catch {}
      if (albumName && artists[0]) {
        try {
          const urlAlbum = new URL(LASTFM_API);
          urlAlbum.searchParams.set("method", "album.getInfo");
          urlAlbum.searchParams.set("api_key", apiKey);
          urlAlbum.searchParams.set("format", "json");
          urlAlbum.searchParams.set("album", albumName);
          urlAlbum.searchParams.set("artist", artists[0]);
          const r2 = await fetch(urlAlbum.toString());
          if (r2.ok) {
            const j2: any = await r2.json();
            albumWiki = sanitize(j2?.album?.wiki?.summary);
          }
        } catch {}
      }
      if (artists[0]) {
        try {
          const urlArtist = new URL(LASTFM_API);
          urlArtist.searchParams.set("method", "artist.getInfo");
          urlArtist.searchParams.set("api_key", apiKey);
          urlArtist.searchParams.set("format", "json");
          urlArtist.searchParams.set("artist", artists[0]);
          const r3 = await fetch(urlArtist.toString());
          if (r3.ok) {
            const j3: any = await r3.json();
            artistWiki = sanitize(j3?.artist?.bio?.summary);
          }
        } catch {}
      }
    }

    return Response.json({
      ok: true,
      id,
      title,
      artists,
      albumName,
      albumImageUrl,
      trackWiki,
      albumWiki,
  artistWiki,
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}

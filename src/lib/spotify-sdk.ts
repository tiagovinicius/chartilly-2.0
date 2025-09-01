export type SpotifyToken = { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string };

export type SpotifyProfile = { id: string; display_name?: string; email?: string };
export type SpotifyPlaylist = { id: string; name: string; tracks: { total: number }; owner: { id: string }; images?: Array<{ url: string }> };
export type SpotifyTelemetry = { totalRequests: number; retries: number; rateLimited: number };

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// small helper for backoff
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retry-aware fetch for Spotify endpoints (handles 429 and 5xx with exponential backoff + jitter)
async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 4, stats?: SpotifyTelemetry): Promise<Response> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    stats && (stats.totalRequests += 1);
    const res: Response = await fetch(url, init);
    if (res.status === 429) {
      stats && (stats.rateLimited += 1);
      const retryAfter = Number(res.headers.get("retry-after")) || 1;
      await sleep(retryAfter * 1000);
      attempt++;
      stats && (stats.retries += 1);
      continue;
    }
    if (res.status >= 500 && res.status < 600) {
      const backoff = Math.min(2000, 300 * 2 ** attempt) + Math.floor(Math.random() * 100);
      await sleep(backoff);
      attempt++;
      stats && (stats.retries += 1);
      continue;
    }
    return res;
  }
  stats && (stats.totalRequests += 1);
  return fetch(url, init);
}

export const SpotifyAPI = {
  async searchTrackUri(token: SpotifyToken, artist: string, title: string, stats?: SpotifyTelemetry): Promise<string | null> {
    const headers = { Authorization: `Bearer ${token.access_token}` } as const;

    // normalize inputs a bit
    const norm = (s: string) => s.trim();
    const artistN = norm(artist);
    const titleN = norm(title);

    // Use only the most effective query first to reduce API calls
    const q = encodeURIComponent(`track:"${titleN}" artist:"${artistN}"`);

    try {
      stats && (stats.totalRequests += 1);
      const res: Response = await fetchWithRetry(`${SPOTIFY_API}/search?type=track&limit=1&q=${q}`, { headers }, 2, stats);

      if (res.ok) {
        const json: any = await res.json();
        const uri = json?.tracks?.items?.[0]?.uri as string | undefined;
        if (uri) return uri;
      }

      // If the precise search fails, try a fallback with looser matching
      const fallbackQ = encodeURIComponent(`${titleN} ${artistN}`);
      stats && (stats.totalRequests += 1);
      const fallbackRes = await fetchWithRetry(`${SPOTIFY_API}/search?type=track&limit=1&q=${fallbackQ}`, { headers }, 1, stats);

      if (fallbackRes.ok) {
        const json: any = await fallbackRes.json();
        const uri = json?.tracks?.items?.[0]?.uri as string | undefined;
        if (uri) return uri;
      }
    } catch (error) {
      // Log and continue - don't let one failed search break the whole sync
      console.warn(`Search failed for ${artistN} - ${titleN}:`, error);
    }

    return null;
  },

  async getOrCreatePlaylistByName(token: SpotifyToken, ownerId: string, name: string, description?: string): Promise<string> {
    // try to find existing
    const playlists = await this.listUserPlaylists(token, ownerId);
    const found = playlists.find(p => p.name === name);
    if (found) return found.id;
    // create
    const res: Response = await fetch(`${SPOTIFY_API}/users/${ownerId}/playlists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.access_token}`,
      },
  body: JSON.stringify({ name, description: description ?? "Chartilly Weekly Top 100", public: false }),
    });
    if (!res.ok) throw new Error(`Spotify create playlist failed: ${res.status}`);
    const json: any = await res.json();
    return json.id as string;
  },

  async exchangeCodeForToken(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<SpotifyToken> {
    const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
    const res: Response = await fetch(SPOTIFY_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64") }, body: body.toString() });
    if (!res.ok) { const err = await res.text(); throw new Error(`Spotify token exchange failed: ${res.status} ${err}`); }
    return res.json();
  },

  async refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<SpotifyToken> {
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
    const res: Response = await fetch(SPOTIFY_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64") }, body: body.toString() });
    if (!res.ok) { const err = await res.text(); throw new Error(`Spotify token refresh failed: ${res.status} ${err}`); }
    return res.json();
  },

  async getCurrentUserProfile(token: SpotifyToken): Promise<SpotifyProfile> {
    const res: Response = await fetch(`${SPOTIFY_API}/me`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!res.ok) throw new Error(`Spotify me failed: ${res.status}`);
    return res.json();
  },

  async listUserPlaylists(token: SpotifyToken, ownerId?: string, stats?: SpotifyTelemetry): Promise<Array<{ id: string; name: string; tracksTotal: number; imageUrl: string | null }>> {
    const items: SpotifyPlaylist[] = [];
    let url: string | null = `${SPOTIFY_API}/me/playlists?limit=50`;
    while (url) {
      const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token.access_token}` } }, 4, stats);
      if (!res.ok) throw new Error(`Spotify playlists failed: ${res.status}`);
      const page: { items: SpotifyPlaylist[]; next: string | null } = await res.json();
      items.push(...page.items);
      url = page.next;
    }
    const filtered = ownerId ? items.filter(p => p.owner?.id === ownerId) : items;
  return filtered.map(p => ({ id: p.id, name: p.name, tracksTotal: p.tracks?.total ?? 0, imageUrl: p.images?.[0]?.url ?? null }));
  },

  async getPlaylistTracks(token: SpotifyToken, playlistId: string, stats?: SpotifyTelemetry): Promise<string[]> {
    const uris: string[] = [];
    let url: string | null = `${SPOTIFY_API}/playlists/${playlistId}/tracks?limit=100`;
    while (url) {
      const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token.access_token}` } }, 4, stats);
      if (!res.ok) throw new Error(`Spotify tracks failed: ${res.status}`);
      const page: { items: Array<{ track: { uri?: string } | null }>; next: string | null } = await res.json();
      for (const it of page.items) { if (it?.track?.uri) uris.push(it.track.uri); }
      url = page.next;
    }
    return uris;
  },

  async replacePlaylistTracks(token: SpotifyToken, playlistId: string, uris: string[]) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.access_token}`,
    } as const;
    const first = uris.slice(0, 100);
    const resPut: Response = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ uris: first }),
    });
    if (!resPut.ok) throw new Error(`Spotify replace failed: ${resPut.status}`);
    for (let i = 100; i < uris.length; i += 100) {
      const chunk = uris.slice(i, i + 100);
      const resPost: Response = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers,
        body: JSON.stringify({ uris: chunk }),
      });
      if (!resPost.ok) throw new Error(`Spotify add failed: ${resPost.status}`);
    }
  },

  async reorderPlaylist(token: SpotifyToken, playlistId: string, range_start: number, insert_before: number, range_length?: number) {
    const res: Response = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.access_token}`,
      },
      body: JSON.stringify({ range_start, insert_before, range_length }),
    });
    if (!res.ok) throw new Error(`Spotify reorder failed: ${res.status}`);
    return res.json();
  },

  async getPlaylistMeta(token: SpotifyToken, playlistId: string): Promise<{ id: string; name: string; imageUrl: string | null; externalUrl: string | null }> {
    const res: Response = await fetch(`${SPOTIFY_API}/playlists/${playlistId}`, { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!res.ok) throw new Error(`Spotify playlist meta failed: ${res.status}`);
    const json: any = await res.json();
    const imageUrl = (json?.images?.[0]?.url as string | undefined) ?? null;
    const externalUrl = (json?.external_urls?.spotify as string | undefined) ?? null;
    return { id: json.id as string, name: json.name as string, imageUrl, externalUrl };
  },

  async getTracksMeta(
    token: SpotifyToken,
    ids: string[],
    stats?: SpotifyTelemetry
  ): Promise<Array<{ id: string; name: string; artists: string[]; albumImageUrl: string | null; albumName: string | null }>> {
    const headers = { Authorization: `Bearer ${token.access_token}` } as const;
    const out: Array<{ id: string; name: string; artists: string[]; albumImageUrl: string | null; albumName: string | null }> = [];
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const url = `${SPOTIFY_API}/tracks?ids=${encodeURIComponent(chunk.join(','))}`;
      const res = await fetchWithRetry(url, { headers }, 4, stats);
      if (!res.ok) throw new Error(`Spotify tracks meta failed: ${res.status}`);
      const json: any = await res.json();
      const tracks: any[] = json?.tracks ?? [];
      for (const t of tracks) {
        if (!t) continue;
        const imageUrl = (t?.album?.images?.[0]?.url as string | undefined) ?? null;
        const albumName = (t?.album?.name as string | undefined) ?? null;
        const artists = Array.isArray(t?.artists) ? t.artists.map((a: any) => a?.name).filter(Boolean) : [];
        out.push({ id: t.id as string, name: t.name as string, artists, albumImageUrl: imageUrl, albumName });
      }
    }
    return out;
  },
};

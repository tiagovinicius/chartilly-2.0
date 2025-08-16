export type LastFmTrack = { artist: string; title: string };

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_AUTH = "https://www.last.fm/api/auth/";

function md5(input: string): string {
  // lightweight MD5 via Web Crypto if available, else throw
  if (typeof crypto !== "undefined" && "subtle" in crypto) {
    // Note: SubtleCrypto is async; but our call sites can await
    throw new Error("md5 not supported in this runtime");
  }
  // Fallback: not available in edge by default. We'll compute on server using Node's crypto in route instead.
  throw new Error("md5 not available");
}

export const LastFmAPI = {
  getAuthUrl(callbackUrl: string, apiKey: string): string {
    const u = new URL(LASTFM_AUTH);
    u.searchParams.set("api_key", apiKey);
    u.searchParams.set("cb", callbackUrl);
    return u.toString();
  },

  async getSession(token: string, apiKey: string, apiSecret: string): Promise<{ key: string; name: string }> {
    // We cannot rely on Web Crypto MD5 in edge; defer signature to Node's crypto md5 in server routes.
    // This function will be a thin wrapper; the route will compute api_sig and pass full URL.
    const url = new URL(LASTFM_API);
    url.searchParams.set("method", "auth.getSession");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("token", token);
    // api_sig must be added by caller
    throw new Error("getSession requires api_sig; use route helper to sign request");
  },

  async getWeeklyTop50(username: string, apiKey: string): Promise<LastFmTrack[]> {
    const url = new URL(LASTFM_API);
    url.searchParams.set("method", "user.gettoptracks");
    url.searchParams.set("user", username);
    url.searchParams.set("period", "7day");
    url.searchParams.set("limit", "50");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");

    const res: Response = await fetch(url.toString());
    if (!res.ok) throw new Error(`Last.fm error: ${res.status}`);
    const data: any = await res.json();
    const tracks: any[] = data?.toptracks?.track ?? [];
    return tracks.map(t => ({ artist: t?.artist?.name as string, title: t?.name as string })).filter(t => t.artist && t.title);
  }
};

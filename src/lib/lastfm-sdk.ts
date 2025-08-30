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
  },

  async getILoveMondaysTop100(username: string, apiKey: string): Promise<LastFmTrack[]> {
    // Calculate the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, else go back (dayOfWeek - 1) days
    
    // Get last Monday's date
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysFromMonday - 7); // Go back to previous Monday
    lastMonday.setHours(0, 0, 0, 0);
    
    // Calculate end date based on current day
    const endDate = new Date(now);
    if (dayOfWeek === 1) { // If today is Monday
      // Show from last Monday to end of last Sunday
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Show from last Monday to yesterday
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    }

    const fromTimestamp = Math.floor(lastMonday.getTime() / 1000);
    const toTimestamp = Math.floor(endDate.getTime() / 1000);

    const url = new URL(LASTFM_API);
    url.searchParams.set("method", "user.gettoptracks");
    url.searchParams.set("user", username);
    url.searchParams.set("from", fromTimestamp.toString());
    url.searchParams.set("to", toTimestamp.toString());
    url.searchParams.set("limit", "100");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");

    const res: Response = await fetch(url.toString());
    if (!res.ok) throw new Error(`Last.fm error: ${res.status}`);
    const data: any = await res.json();
    const tracks: any[] = data?.toptracks?.track ?? [];
    return tracks.map(t => ({ artist: t?.artist?.name as string, title: t?.name as string })).filter(t => t.artist && t.title);
  }
};

import { Pacifico } from "next/font/google";
import { headers } from "next/headers";
import HomeLanding from "./home-landing";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400", display: "swap" });

type Playlist = { id: string; name: string; tracksTotal: number; imageUrl: string | null };

export default async function Home() {
  const hdrs = await headers();
  const cookieHeader = hdrs.get('cookie') ?? '';
  const common: RequestInit = { cache: "no-store", headers: cookieHeader ? { cookie: cookieHeader } : undefined };
  const [chartsRes, playlistsRes] = await Promise.all([
    fetch(`/api/charts/top50`, common).catch(() => null),
    fetch(`/api/playlists`, common).catch(() => null),
  ]);
  const charts = chartsRes && chartsRes.ok ? await chartsRes.json() : null;
  const target = charts?.target as { id: string | null; name: string | null; imageUrl?: string | null } | undefined;
  const playlistsJson = playlistsRes && playlistsRes.ok ? await playlistsRes.json() : { playlists: [] };
  const allPlaylists: Playlist[] = Array.isArray(playlistsJson.playlists) ? playlistsJson.playlists : [];

  // pick top 9 by tracksTotal (proxy for "most played")
  const sorted = [...allPlaylists].sort((a, b) => (b.tracksTotal ?? 0) - (a.tracksTotal ?? 0));
  const pick = sorted.slice(0, 9);

  return (
    <section className="px-4 py-6 mx-auto w-full max-w-screen-md bg-white">
      {/* Logo at top */}
      <div className="text-center mb-8">
        <div className={pacifico.className} style={{
          color: "hsl(var(--primary))",
          fontSize: "clamp(42px, 10vw, 96px)",
          fontWeight: 900,
          letterSpacing: "normal",
          lineHeight: 1,
        }}>chartilly</div>
      </div>
      <HomeLanding />
    </section>
  );
}

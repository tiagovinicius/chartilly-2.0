"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

type Playlist = { id: string; name: string; tracksTotal: number; imageUrl: string | null };
type ChartData = {
  target?: { id: string | null; name: string | null; imageUrl?: string | null; externalUrl?: string | null };
};

export default function HomeLanding() {
  const [loading, setLoading] = useState(true);
  // Weekly Top 100 data
  const [top100Data, setTop100Data] = useState<ChartData>({});
  // I Love Mondays data
  const [ilovemondaysData, setIlovemondaysData] = useState<ChartData>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/charts/top50', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/charts/ilovemondays', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/playlists', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([top100, ilovemondays, pls]) => {
      if (!mounted) return;
      setTop100Data(top100 || {});
      setIlovemondaysData(ilovemondays || {});
      const arr = Array.isArray(pls?.playlists) ? (pls.playlists as Playlist[]) : [];
      setPlaylists(arr);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const topNine = [...playlists].sort((a,b)=> (b.tracksTotal ?? 0) - (a.tracksTotal ?? 0)).slice(0,9);

  function renderChartTile(
    title: string,
    data: ChartData,
    href: string,
    selectHref: string,
    loading: boolean
  ) {
    const targetImage = data?.target?.imageUrl;
    const targetName = data?.target?.name;

    return (
      <div className="flex-shrink-0 w-56">
        <h2 className="text-xl font-bold mb-2 text-left">{title}</h2>
        <a href={loading ? "#" : (targetImage ? href : selectHref)} className="inline-block">
          {loading ? (
            <div className="w-56 aspect-square rounded-md overflow-hidden skeleton" aria-hidden />
          ) : targetImage ? (
            <div
              className="w-56 aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
              style={{ backgroundImage: `url(${targetImage})` }}
              aria-label={`${title} playlist cover`}
              title={targetName ?? undefined}
            >
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                <span className="block truncate">{targetName ?? '—'}</span>
              </div>
            </div>
          ) : (
            <div
              className="w-56 aspect-square rounded-md border-4 border-dashed grid place-items-center text-center px-3"
              style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}
              aria-label="Choose the destination playlist"
              title="Choose the destination playlist"
            >
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-8 h-8" aria-hidden="true" />
                <span className="text-sm font-semibold">Choose the destination playlist</span>
              </div>
            </div>
          )}
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-3">Charts</h1>

      {/* Horizontal scroll container for charts */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 w-max">
          {renderChartTile("I Love Mondays", ilovemondaysData, "/charts/ilovemondays", "/charts/ilovemondays/select", loading)}
          {renderChartTile("Weekly Top 100", top100Data, "/charts", "/charts/select", loading)}
        </div>
      </div>      <div className="mt-10 flex items-center justify-between">
  <h2 className="text-xl font-bold">My playlists</h2>
        <a href="/playlists" className="text-sm underline">View all</a>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <div className="w-full aspect-square rounded-md overflow-hidden skeleton" aria-hidden />
              <div className="sr-only">Loading</div>
            </div>
          ))
        ) : topNine.length > 0 ? (
          topNine.map((p) => (
            <div key={p.id}>
              <a href={`/playlists/${p.id}`} className="block link-reset" aria-label={p.name} title={p.name}>
                <div
                  className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
                  style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
                >
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                    <span className="block truncate">{p.name}</span>
                  </div>
                </div>
              </a>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-sm text-muted-foreground">No playlists found.</div>
        )}
      </div>
    </div>
  );
}

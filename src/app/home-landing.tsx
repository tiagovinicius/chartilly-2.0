"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

type Playlist = { id: string; name: string; tracksTotal: number; imageUrl: string | null };

export default function HomeLanding() {
  const [loading, setLoading] = useState(true);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/charts/top50', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/playlists', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([charts, pls]) => {
      if (!mounted) return;
      const img = charts?.target?.imageUrl ?? null;
      setTargetImage(typeof img === 'string' ? img : null);
      setTargetName(typeof charts?.target?.name === 'string' ? charts.target.name : null);
      const arr = Array.isArray(pls?.playlists) ? (pls.playlists as Playlist[]) : [];
      setPlaylists(arr);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const topNine = [...playlists].sort((a,b)=> (b.tracksTotal ?? 0) - (a.tracksTotal ?? 0)).slice(0,9);

  return (
    <div>
  <h1 className="text-2xl md:text-3xl font-bold mb-3">Charts</h1>
  <h2 className="text-xl font-bold mb-2">Weekly Top 50</h2>
  <a href={loading ? "#" : (targetImage ? "/charts" : "/charts/select")} className="inline-block">
        {loading ? (
          <div className="w-56 aspect-square rounded-md overflow-hidden skeleton" aria-hidden />
        ) : targetImage ? (
          <div
            className="w-56 aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
            style={{ backgroundImage: `url(${targetImage})` }}
            aria-label="Target playlist cover"
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

      <div className="mt-10 flex items-center justify-between">
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

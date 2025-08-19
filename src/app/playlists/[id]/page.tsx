"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { History, Shuffle, ArrowLeft, Play } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function PlaylistDetailPage(){
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ id: string; name: string; imageUrl?: string|null; externalUrl?: string|null }|null>(null);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; artists: string[]; albumImageUrl: string | null }>>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; date: string }>>([]);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/playlists/${id}`).then(r=>r.json()).then((j)=>{
      if(!mounted) return;
      if (j?.ok) {
        setMeta(j.meta);
        setTracks(Array.isArray(j.tracks) ? j.tracks : []);
      }
    }).finally(()=>setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  async function doShuffle(){
    setBusy(true);
    try{ await fetch(`/api/playlists/${id}/shuffle`, { method: 'POST' }); } finally { setBusy(false); }
  }

  async function loadHistory(){
    // Placeholder: would fetch real shuffle history; using synthetic data
    setHistory([
      { id: '1', date: new Date().toISOString() },
    ]);
  }

  return (
    <section className="p-4 space-y-4" aria-labelledby="title">
      <div className="mt-4 flex items-center justify-start pb-3">
        <Button type="button" variant="secondary" size="icon" className="rounded-full w-12 h-12" aria-label="Back" onClick={()=>router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      <h1 id="title" className="text-2xl md:text-3xl font-bold text-center pb-4 text-[hsl(var(--secondary-foreground))]">
        {loading ? (
          <span className="inline-block h-7 w-48 rounded skeleton align-middle" aria-hidden />
        ) : (
          meta?.name || '—'
        )}
      </h1>

      <div className="flex flex-col items-center gap-4 min-h-[18rem]">
        {loading ? (
          <div className="w-60 aspect-square rounded-md overflow-hidden skeleton" aria-hidden />
        ) : (
          <div
            className="w-60 aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover"
            style={meta?.imageUrl ? { backgroundImage: `url(${meta.imageUrl})` } : undefined}
            aria-label="Playlist cover"
          />
        )}
        <div className="flex items-center gap-3 mt-6 mb-6 min-h-[3.5rem]">
          <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={()=>setConfirmOpen(true)} aria-label="Shuffle">
            <Shuffle className="w-6 h-6" aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={()=>{ setHistoryOpen(true); loadHistory(); }} aria-label="History">
            <History className="w-6 h-6" aria-hidden="true" />
          </Button>
          <a href={meta?.externalUrl ?? '#'} target="_blank" rel="noreferrer" aria-label="Open in Spotify">
            <Button variant="default" size="lg" className="rounded-full w-14 h-14 p-0">
              <Play className="w-7 h-7" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>

      {/* History sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Shuffle history</SheetTitle>
          </SheetHeader>
          <ol className="space-y-2">
            {history.map(h => (
              <li key={h.id} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{new Date(h.date).toLocaleString()}</span>
                <Button size="sm" variant="ghost" onClick={async ()=>{ await fetch(`/api/playlists/${id}/rollback`, { method: 'POST' }); }}>Revert</Button>
              </li>
            ))}
          </ol>
        </SheetContent>
      </Sheet>

      {/* Confirm shuffle sheet */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Shuffle now?</SheetTitle>
          </SheetHeader>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost" size="lg">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button size="lg" disabled={busy} onClick={doShuffle}>Confirm</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Tracks list */}
      {loading ? (
        <ol className="space-y-3" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i}>
              <div className="flex items-center gap-3 py-1">
                <div className="w-12 aspect-square flex-shrink-0 rounded-sm skeleton" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="space-y-3">
          {tracks.map((t) => (
            <li key={t.id}>
              <a href={`/tracks/${t.id}`} className="flex items-center gap-3 py-1 hover:bg-accent/30 rounded link-reset">
                <div className="w-12 aspect-square flex-shrink-0 rounded-sm bg-muted/30 bg-center bg-cover" style={t.albumImageUrl ? { backgroundImage: `url(${t.albumImageUrl})` } : undefined} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{t.name}</div>
                  <div className="text-xs truncate">{t.artists.join(', ')}</div>
                </div>
              </a>
            </li>
          ))}
          {tracks.length === 0 && (
            <li className="text-sm text-muted-foreground">No tracks.</li>
          )}
        </ol>
      )}
    </section>
  );
}

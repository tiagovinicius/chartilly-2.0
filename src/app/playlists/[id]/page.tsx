"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { History, Shuffle, ArrowLeft, Play, Loader2 } from "lucide-react";
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
  const [hasHistory, setHasHistory] = useState<boolean>(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; variant: "info"|"success"|"error"; loading?: boolean }>({ open: false, message: "", variant: "info" });
  const [toastTimer, setToastTimer] = useState<number | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [toastOffset, setToastOffset] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/playlists/${id}`).then(r=>r.json()).then((j)=>{
      if(!mounted) return;
      if (j?.ok) {
        setMeta(j.meta);
        setTracks(Array.isArray(j.tracks) ? j.tracks : []);
      }
    }).finally(()=>setLoading(false));
    // prefetch history size to enable/disable History button
    fetch(`/api/playlists/${id}/history`).then(r=>r.json()).then((j)=>{
      if(!mounted) return;
      if (j?.ok && Array.isArray(j.history)) setHasHistory(j.history.length > 0);
    }).catch(()=>{});
    return () => { mounted = false; };
  }, [id]);

  async function doShuffle(){
    setBusy(true);
    // show shuffling toast
    if (toastTimer) { window.clearTimeout(toastTimer); setToastTimer(null); }
    setToast({ open: true, message: 'Shuffling…', variant: 'info', loading: true });
    try{
      const res = await fetch(`/api/playlists/${id}/shuffle`, { method: 'POST' });
      if (res.ok) {
        // on first shuffle we now have a backup
        setHasHistory(true);
        // refresh tracks/meta
        setLoading(true);
        try {
          const j = await fetch(`/api/playlists/${id}`).then(r=>r.json());
          if (j?.ok) { setMeta(j.meta); setTracks(Array.isArray(j.tracks) ? j.tracks : []); }
        } finally { setLoading(false); }
        setToast({ open: true, message: 'Shuffle completed', variant: 'success' });
        const t = window.setTimeout(()=>{ setToast(s=>({ ...s, open: false })); setToastTimer(null); }, 2600) as unknown as number;
        setToastTimer(t);
      } else {
        setToast({ open: true, message: 'Shuffle failed', variant: 'error' });
        const t = window.setTimeout(()=>{ setToast(s=>({ ...s, open: false })); setToastTimer(null); }, 2600) as unknown as number;
        setToastTimer(t);
      }
    } finally { setBusy(false); }
  }

  // Keep layout offset equal to toast height while toast is visible
  useEffect(() => {
    function refreshOffset(){
      const el = toastRef.current;
      setToastOffset(toast.open && el ? el.offsetHeight : 0);
    }
    refreshOffset();
    if (!toast.open) return;
    const observer = new ResizeObserver(() => refreshOffset());
    if (toastRef.current) observer.observe(toastRef.current);
    const onScrollOrResize = () => refreshOffset();
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [toast.open]);

  async function loadHistory(){
    try{
      const res = await fetch(`/api/playlists/${id}/history`);
      const j = await res.json();
      if (j?.ok && Array.isArray(j.history)) {
        setHistory(j.history.map((h: any) => ({ id: String(h.id), date: h.created_at })));
  setHasHistory(j.history.length > 0);
      }
    } catch {}
  }

  return (
    <section className="p-4 space-y-4" aria-labelledby="title">
  {toast.open && <div style={{ height: toastOffset }} aria-hidden="true" />}
      <div className="mt-4 flex items-center justify-start pb-3">
        <Button type="button" variant="secondary" size="icon" className="rounded-full w-12 h-12" aria-label="Back" onClick={()=>router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
  {/* Title moved below cover as H2 */}

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
        <div className="h-8 w-full flex items-center justify-center text-center">
          {loading ? (
            <div className="h-6 w-48 rounded skeleton" aria-hidden />
          ) : (
            <h2 className="text-xl font-bold truncate text-[hsl(var(--primary))]">{meta?.name || '—'}</h2>
          )}
        </div>
        <div className="flex items-center gap-3 mt-6 mb-6 min-h-[3.5rem]">
          <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={()=>setConfirmOpen(true)} aria-label="Shuffle" disabled={busy}>
            <Shuffle className="w-6 h-6" aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={()=>{ setHistoryOpen(true); loadHistory(); }} aria-label="History" disabled={!hasHistory}>
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
                <Button size="sm" variant="ghost" onClick={async ()=>{
                  try {
                    const res = await fetch(`/api/playlists/${id}/rollback`, { method: 'POST' });
                    if (res.ok) {
                      // refresh tracks view
                      setLoading(true);
                      fetch(`/api/playlists/${id}`).then(r=>r.json()).then((j)=>{
                        if (j?.ok) { setMeta(j.meta); setTracks(j.tracks || []); }
                      }).finally(()=>setLoading(false));
                      // reload history after revert
                      loadHistory();
                    } else {
                    }
                  } catch {}
                }}>Revert</Button>
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

      {/* Toast */}
    {toast.open && (
        <div
          className={`fixed top-0 inset-x-0 z-[60] px-4 py-2 shadow-md border-b text-sm text-white text-center ${toast.variant === 'success' ? 'bg-emerald-600' : toast.variant === 'error' ? 'bg-red-600' : 'bg-neutral-900/90'}`}
          role={toast.variant === 'info' && toast.loading ? 'status' : 'alert'}
          aria-live={toast.variant === 'info' && toast.loading ? 'polite' : 'assertive'}
      ref={toastRef}
        >
          <div className="flex items-center justify-center gap-2">
            {toast.loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </section>
  );
}

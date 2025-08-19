"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Settings, Upload, Loader2, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";

export default function ChartsPage(){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{tracks: Array<string | { id: string; name: string; artists: string[]; albumImageUrl: string | null }>, updatedAt: string|null, target?: { id: string|null; name: string|null; imageUrl?: string|null; externalUrl?: string|null }}>({tracks: [], updatedAt: null});
  const [playlists, setPlaylists] = useState<Array<{id:string; name:string; imageUrl?: string|null}>>([]);
  const [targetType, setTargetType] = useState<"existing"|"new">("existing");
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("Chartilly Top of the Week");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState<{ playlistId?: string; playlistName?: string }|null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; variant: "info"|"success"|"error"; loading?: boolean }>({ open: false, message: "", variant: "info" });
  const toastTimer = useRef<number | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [toastOffset, setToastOffset] = useState(0);

  function showToast(message: string, opts?: { variant?: "info"|"success"|"error"; loading?: boolean; durationMs?: number }){
    // clear any prior auto-hide timer
    if (toastTimer.current) { window.clearTimeout(toastTimer.current); toastTimer.current = null; }
    const variant = opts?.variant ?? "info";
    const loading = opts?.loading ?? false;
    setToast({ open: true, message, variant, loading });
    // Auto-hide only when not loading
    const dur = opts?.durationMs ?? 2600;
    if (!loading) {
      toastTimer.current = window.setTimeout(() => {
        setToast(t => ({ ...t, open: false }));
        toastTimer.current = null;
      }, dur) as unknown as number;
    }
  }
  async function saveTarget(target: { playlistId?: string; playlistName?: string }){
    try{
      const res = await fetch('/api/charts/top50/target', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) });
      if(res.ok){
        const j = await res.json();
        if(j?.target){ setData(d => ({ ...d, target: j.target })); }
      }
    }catch{}
  }

  useEffect(() => {
  fetch("/api/charts/top50").then(r=>r.json()).then((j)=>{
      setData(j);
      if (j?.target?.id) { setTargetType("existing"); setTargetPlaylistId(j.target.id); }
      else if (j?.target?.name) { setTargetType("new"); setTargetName(j.target.name); }
    }).finally(()=>setLoading(false));
  fetch("/api/playlists").then(r=>r.json()).then((j)=>{ if (Array.isArray(j.playlists)) setPlaylists(j.playlists); }).catch(()=>{});
  }, []);

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

  async function syncNow(override?: { playlistId?: string; playlistName?: string }){
    setBusy(true);
    showToast('Syncing…', { variant: 'info', loading: true });
    const body: any = {};
    if (override?.playlistId) body.playlistId = override.playlistId;
    else if (override?.playlistName) body.playlistName = override.playlistName;
    else {
      if (targetType === "existing" && targetPlaylistId) body.playlistId = targetPlaylistId;
      if (targetType === "new") body.playlistName = (targetName || "").trim() || "Chartilly Top of the Week";
    }
    body.savePreference = true;
  const res = await fetch('/api/charts/top50/sync', {method:'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)});
    if (res.ok) {
      showToast('Sync completed', { variant: 'success' });
    } else {
      let msg = 'Sync failed';
      try { const j = await res.json(); if (j?.error) msg = `Sync failed: ${j.error}`; } catch {}
      showToast(msg, { variant: 'error' });
    }
    setBusy(false);
  }

  return (
  <section className={`p-4 space-y-4 pt-2`} aria-labelledby="title">
      {toast.open && <div style={{ height: toastOffset }} aria-hidden="true" />}
  <div className="mt-4 flex items-center justify-start pb-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="rounded-full w-12 h-12"
          aria-label="Back"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      <h1 id="title" className="text-2xl md:text-3xl font-bold text-center pb-4 text-[hsl(var(--secondary-foreground))]">Weekly Top 50</h1>

      {/* Header with cover, centered name, circular actions on right */}
  <div className="flex flex-col items-center gap-4 min-h-[18rem]">
        {loading ? (
          <>
            <div className="w-60 aspect-square rounded-md overflow-hidden skeleton" aria-hidden />
            <div className="h-8 w-full flex items-center justify-center" aria-hidden>
              <div className="h-8 w-48 rounded skeleton" />
            </div>
          </>
        ) : (
          <>
            <div
              className="w-60 aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover"
              aria-label="Playlist cover"
              role="img"
              style={data?.target?.imageUrl ? { backgroundImage: `url(${data.target.imageUrl})` } : undefined}
            />
            <div className="h-8 w-full flex items-center justify-center text-center">
              <h2 className="text-xl font-bold truncate text-[hsl(var(--primary))]">{data?.target?.name ?? (targetType === 'new' ? targetName : '—')}</h2>
            </div>
          </>
        )}
  <div className="flex items-center gap-3 mt-6 mb-6 min-h-[3.5rem]">
          <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={() => syncNow()} disabled={busy} aria-label="Sync">
            <Upload className="w-6 h-6" aria-hidden="true" />
          </Button>
      <Sheet open={sheetOpen} onOpenChange={(o)=>{ setSheetOpen(o); if (o) setTimeout(()=>{ const el = document.querySelector('[role=\"dialog\"]'); if (el) el.scrollTop = 0; }, 0); }}>
            <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" aria-label="Edit destination">
                <Settings className="w-6 h-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" aria-label="Close">
                  <X className="w-4 h-4" />
                </Button>
              </SheetClose>
              <SheetHeader>
                <SheetTitle>Choose the destination playlist</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3">
                {/* Add tile */}
                <button
                  className="w-full aspect-square rounded-md border border-dashed flex items-center justify-center text-sm hover:bg-accent/10"
                  onClick={() => { setSheetOpen(false); setAddOpen(true); }}
                >
                  Add
                </button>
        {playlists.map(p => (
                  <button
                    key={p.id}
                    className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
                    style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
    onClick={async () => { setTargetType("existing"); setTargetPlaylistId(p.id); setData(d => ({...d, target: { id: p.id, name: p.name, imageUrl: p.imageUrl ?? null, externalUrl: d?.target?.externalUrl ?? null }})); await saveTarget({ playlistId: p.id }); setSheetOpen(false); setConfirmOverride({ playlistId: p.id, playlistName: p.name }); setConfirmOpen(true); }}
                    aria-label={`Use ${p.name}`}
                    title={p.name}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                      <span className="block truncate">{p.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          {/* Add new playlist sheet */}
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>New playlist name</SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                <Input value={targetName} onChange={(e)=>setTargetName(e.target.value)} placeholder="Chartilly Top of the Week" />
                <SheetFooter>
                  <SheetClose asChild>
  <Button variant="ghost" size="lg">Cancel</Button>
                  </SheetClose>
                  <SheetClose asChild>
  <Button size="lg" onClick={async ()=>{ setTargetType("new"); const name = (targetName || '').trim() || 'Chartilly Top of the Week'; await saveTarget({ playlistName: name }); setSheetOpen(false); setConfirmOverride({ playlistName: name }); setConfirmOpen(true); }}>Confirm</Button>
                  </SheetClose>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
          {/* Confirm sync sheet */}
          <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sync now?</SheetTitle>
              </SheetHeader>
              <p className="text-sm text-muted-foreground mb-3">Destination: <span className="font-medium">{confirmOverride?.playlistName || data?.target?.name || '—'}</span></p>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="ghost" size="lg">Cancel</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button size="lg" disabled={busy} onClick={async ()=>{ if (confirmOverride) { await syncNow(confirmOverride); setConfirmOverride(null); } }}>Sync now</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <a href={data?.target?.externalUrl ?? '#'} target="_blank" rel="noreferrer" aria-label="Open in Spotify">
            <Button variant="default" size="lg" className="rounded-full w-14 h-14 p-0">
              <Play className="w-7 h-7" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>

      {/* Legacy edit block removed in favor of sheets */}

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
          {data.tracks.map((t: any, i) => {
            const isObj = t && typeof t === 'object';
            const title = isObj ? t.name : String(t);
            const artist = isObj ? (Array.isArray(t.artists) ? t.artists.join(', ') : '') : '';
            const img = isObj ? t.albumImageUrl : null;
            // derive id: from enriched object id or from URI spotify:track:ID
            let id: string | null = null;
            if (isObj && t.id) id = t.id;
            else if (!isObj && typeof t === 'string' && t.startsWith('spotify:track:')) id = t.split(':')[2] ?? null;
            return (
              <li key={i} className="">
                <a href={id ? `/tracks/${id}` : '#'} className="flex items-center gap-3 py-1 hover:bg-accent/30 rounded link-reset">
                  <div className="w-12 aspect-square flex-shrink-0 rounded-sm bg-muted/30 bg-center bg-cover" style={img ? { backgroundImage: `url(${img})` } : undefined} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{title}</div>
                    <div className="text-xs truncate">{artist}</div>
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      )}
      {/* Toast */}
      {toast.open && (
        <div
          className={`fixed top-0 inset-x-0 z-[60] px-4 py-2 shadow-md border-b text-sm text-white text-center ${toast.variant === 'success' ? 'bg-emerald-600' : toast.variant === 'error' ? 'bg-red-600' : 'bg-neutral-900/90'}`}
          ref={toastRef}
          role={toast.variant === 'info' && toast.loading ? 'status' : 'alert'}
          aria-live={toast.variant === 'info' && toast.loading ? 'polite' : 'assertive'}
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

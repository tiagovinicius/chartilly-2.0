"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Settings, Upload, Loader2, X, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import Link from "next/link";

export default function ILoveMondaysPage(){
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{tracks: Array<string | { id: string; name: string; artists: string[]; albumImageUrl: string | null }>, updatedAt: string|null, weekStartDate: string|null, target?: { id: string|null; name: string|null; imageUrl?: string|null; externalUrl?: string|null }}>({tracks: [], updatedAt: null, weekStartDate: null});
  const [playlists, setPlaylists] = useState<Array<{id:string; name:string; imageUrl?: string|null}>>([]);
  const [targetType, setTargetType] = useState<"existing"|"new">("existing");
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("I Love Mondays");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [forceSheet, setForceSheet] = useState(false);
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
      const res = await fetch('/api/charts/ilovemondays/target', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) });
      if(res.ok){
        const j = await res.json();
        if(j?.target){ setData(d => ({ ...d, target: j.target })); }
      }
    }catch{}
  }

  async function refreshCharts(){
    try{
      const r = await fetch('/api/charts/ilovemondays', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        setData(j);
        if (j?.target?.id) { setTargetType('existing'); setTargetPlaylistId(j.target.id); }
        else if (j?.target?.name) { setTargetType('new'); setTargetName(j.target.name); }
      }
    }catch{}
  }

  function removeConfirmFlag(){
    try{
      const url = new URL(window.location.href);
      if (url.searchParams.has('confirm')){
        url.searchParams.delete('confirm');
        const qs = url.searchParams.toString();
        const next = url.pathname + (qs ? `?${qs}` : '') + url.hash;
        window.history.replaceState({}, '', next || '/charts/ilovemondays');
      }
    }catch{}
  }

  useEffect(() => {
    fetch("/api/charts/ilovemondays").then(r=>r.json()).then((j)=>{
      setData(j);
      if (j?.target?.id) { setTargetType("existing"); setTargetPlaylistId(j.target.id); }
      else if (j?.target?.name) { setTargetType("new"); setTargetName(j.target.name); }
      // If no target configured, force sheet open
      const hasTarget = !!(j?.target?.id || j?.target?.name);
      if (!hasTarget) { setForceSheet(true); setSheetOpen(true); }
      // If coming from selection flow with confirm flag, open confirm sheet
      try { const params = new URLSearchParams(window.location.search); if (params.get('confirm')) setConfirmOpen(true); } catch {}
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
      if (targetType === "new") body.playlistName = (targetName || "").trim() || "I Love Mondays";
    }
    body.savePreference = true;
    const res = await fetch('/api/charts/ilovemondays/sync', {method:'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)});
    if (res.ok) {
      showToast('Sync completed', { variant: 'success' });
      // Refresh page data and ensure confirm flag is removed so it won't reopen
      await refreshCharts();
      removeConfirmFlag();
    } else {
      let msg = 'Sync failed';
      try { const j = await res.json(); if (j?.error) msg = `Sync failed: ${j.error}`; } catch {}
      showToast(msg, { variant: 'error' });
    }
    setBusy(false);
  }

  function formatWeekDescription(weekStartDate: string | null) {
    if (!weekStartDate) return "";
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Sunday
    
    const now = new Date();
    const isCurrentWeek = startDate <= now && now <= endDate;
    
    if (isCurrentWeek) {
      return `Desde segunda-feira passada até ontem`;
    } else {
      return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }
  }

  return (
    <section className={`p-4 space-y-4`} aria-labelledby="title">
      {toast.open && <div style={{ height: toastOffset }} aria-hidden="true" />}
      
      {/* Back button */}
      <div className="flex items-center mb-4">
        <Link href="/charts">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <h1 id="title" className="mt-4 text-2xl md:text-3xl font-bold text-center pb-2 text-[hsl(var(--secondary-foreground))]">I Love Mondays</h1>
      <p className="text-center text-sm text-muted-foreground pb-4">
        Top 100 músicas {formatWeekDescription(data.weekStartDate)}
      </p>

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
          <Sheet open={sheetOpen} onOpenChange={(o)=>{
            // Block closing when forced (no target yet)
            if (forceSheet && !o) { setSheetOpen(true); return; }
            setSheetOpen(o);
            if (o) setTimeout(()=>{ const el = document.querySelector('[role="dialog"]'); if (el) el.scrollTop = 0; }, 0);
          }}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" aria-label="Edit destination">
                <Settings className="w-6 h-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              // Prevent closing via overlay or ESC while forced
              onInteractOutside={(e)=>{ if (forceSheet) e.preventDefault(); }}
              onEscapeKeyDown={(e)=>{ if (forceSheet) e.preventDefault(); }}
            >
              {!forceSheet && (
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-4 top-4" aria-label="Close">
                    <X className="w-4 h-4" />
                  </Button>
                </SheetClose>
              )}
              <SheetHeader>
                <SheetTitle>Choose the destination playlist</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3">
                {/* Add tile */}
                <button
                  className="w-full aspect-square rounded-md border-4 border-dashed flex items-center justify-center text-sm hover:bg-accent/10"
                  onClick={() => { setForceSheet(false); setSheetOpen(false); setAddOpen(true); }}
                >
                  Add
                </button>
                {playlists.map(p => (
                  <button
                    key={p.id}
                    className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover hover:ring-2 hover:ring-primary relative"
                    style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
                    onClick={() => {
                      setTargetType("existing");
                      setTargetPlaylistId(p.id);
                      setConfirmOverride({ playlistId: p.id });
                      setConfirmOpen(true);
                      setForceSheet(false);
                      setSheetOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                      <span className="text-white text-xs font-medium truncate">{p.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              {!forceSheet && (
                <SheetFooter className="mt-6">
                  <Button
                    onClick={() => {
                      setTargetType("new");
                      setConfirmOverride({ playlistName: targetName });
                      setConfirmOpen(true);
                      setSheetOpen(false);
                    }}
                    className="w-full"
                  >
                    Create New Playlist
                  </Button>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tracks List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border skeleton-content" aria-hidden>
              <div className="w-12 h-12 rounded skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : data.tracks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tracks found. Try syncing to get your I Love Mondays chart!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.tracks.map((track, i) => {
            if (typeof track === 'string') {
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-12 h-12 rounded bg-muted/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{track}</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/5">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded bg-muted/30 bg-center bg-cover"
                    style={track.albumImageUrl ? { backgroundImage: `url(${track.albumImageUrl})` } : undefined}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-lg">#{i + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artists.join(', ')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmOpen(false)}>
          <div className="bg-background p-6 rounded-lg max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Sync to this playlist?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will replace all tracks in {confirmOverride?.playlistId ? "the selected playlist" : `"${confirmOverride?.playlistName}"`} with your current I Love Mondays top 100.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => { setConfirmOpen(false); syncNow(confirmOverride ?? undefined); }} className="flex-1" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Playlist Dialog */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAddOpen(false)}>
          <div className="bg-background p-6 rounded-lg max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create New Playlist</h3>
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="new-playlist-name">Playlist Name</Label>
                <Input
                  id="new-playlist-name"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="I Love Mondays"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setAddOpen(false);
                  setTargetType("new");
                  setConfirmOverride({ playlistName: targetName || "I Love Mondays" });
                  setConfirmOpen(true);
                }}
                className="flex-1"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.open && (
        <div
          ref={toastRef}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            toast.variant === 'success' ? 'bg-green-600 text-white' :
            toast.variant === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}
        >
          {toast.loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {toast.message}
        </div>
      )}
    </section>
  );
}

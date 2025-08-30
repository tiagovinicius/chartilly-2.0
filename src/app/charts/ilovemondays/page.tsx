"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Settings, Upload, Loader2, X, ChevronLeft, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import Link from "next/link";

export default function ILoveMondaysPage(){
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{tracks: Array<string | { id: string; name: string; artists: string[]; albumImageUrl: string | null }>, updatedAt: string|null, weekStartDate: string|null, target?: { id: string|null; name: string|null; imageUrl?: string|null; externalUrl?: string|null }}>({tracks: [], updatedAt: null, weekStartDate: null});
  const [top50Data, setTop50Data] = useState<{target?: { id: string|null; name: string|null; imageUrl?: string|null; externalUrl?: string|null }}>({});
  const [playlists, setPlaylists] = useState<Array<{id:string; name:string; imageUrl?: string|null}>>([]);
  const [targetType, setTargetType] = useState<"existing"|"new">("existing");
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("Chartilly I Love Mondays");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [forceSheet, setForceSheet] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState<{ playlistId?: string; playlistName?: string }|null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
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
      // If no target configured, redirect to selection page
      const hasTarget = !!(j?.target?.id || j?.target?.name);
      if (!hasTarget) { window.location.href = '/charts/ilovemondays/select'; return; }
      // If coming from selection flow with confirm flag, open confirm sheet
      try { const params = new URLSearchParams(window.location.search); if (params.get('confirm')) setConfirmOpen(true); } catch {}
    }).finally(()=>setLoading(false));
    fetch("/api/playlists").then(r=>r.json()).then((j)=>{ if (Array.isArray(j.playlists)) setPlaylists(j.playlists); }).catch(()=>{});
    // Fetch Top 50 data for navigation sheet
    fetch("/api/charts/top50").then(r=>r.json()).then((j)=>{ setTop50Data(j || {}); }).catch(()=>{});
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
      if (targetType === "new") body.playlistName = (targetName || "").trim() || "Chartilly I Love Mondays";
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

    // Calculate the actual period based on I Love Mondays logic
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Get last Monday's date (same logic as in lastfm-sdk.ts)
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysFromMonday - 7);
    lastMonday.setHours(0, 0, 0, 0);

    // Calculate end date (yesterday)
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    return `${lastMonday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${yesterday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }

  return (
    <section className={`p-4 space-y-4`} aria-labelledby="title">
      {toast.open && <div style={{ height: toastOffset }} aria-hidden="true" />}

      <button
        onClick={() => setNavigationOpen(true)}
        className="w-full mt-4 pb-4 text-[hsl(var(--secondary-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-2xl md:text-3xl font-bold">I Love Mondays</span>
        <div className="w-6 h-6 rounded border border-current flex items-center justify-center">
          <ChevronDown className="w-3 h-3" />
        </div>
      </button>
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
          <a href={data?.target?.externalUrl ?? '#'} target="_blank" rel="noreferrer" aria-label="Open in Spotify">
            <Button variant="default" size="lg" className="rounded-full w-14 h-14 p-0">
              <Play className="w-7 h-7" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>

      {/* Tracks List */}
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
      ) : data.tracks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tracks found. Try syncing to get your I Love Mondays chart!</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {data.tracks.map((track, i) => {
            const isObj = track && typeof track === 'object';
            const title = isObj ? track.name : String(track);
            const artist = isObj ? (Array.isArray(track.artists) ? track.artists.join(', ') : '') : '';
            const img = isObj ? track.albumImageUrl : null;
            // derive id: from enriched object id or from URI spotify:track:ID
            let id: string | null = null;
            if (isObj && track.id) id = track.id;
            else if (!isObj && typeof track === 'string' && track.startsWith('spotify:track:')) id = track.split(':')[2] ?? null;
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

      {/* Confirm sync sheet */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sync to this playlist?</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground mb-3">
            This will replace all tracks in {confirmOverride?.playlistId ? "the selected playlist" : `"${confirmOverride?.playlistName}"`} with your current I Love Mondays top 100.
          </p>
          <p className="text-sm text-muted-foreground mb-3">Destination: <span className="font-medium">{confirmOverride?.playlistName || data?.target?.name || '—'}</span></p>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost" size="lg">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button size="lg" disabled={busy} onClick={async ()=>{ await syncNow(confirmOverride || undefined); setConfirmOverride(null); }}>Sync now</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add new playlist sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New playlist name</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            <Input value={targetName} onChange={(e)=>setTargetName(e.target.value)} placeholder="Chartilly I Love Mondays" />
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="ghost" size="lg">Cancel</Button>
              </SheetClose>
              <SheetClose asChild>
                <Button size="lg" onClick={async ()=>{ const name = (targetName || '').trim() || 'Chartilly I Love Mondays'; setTargetType("new"); setConfirmOverride({ playlistName: name }); setAddOpen(false); setConfirmOpen(true); }}>Confirm</Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Navigation Sheet */}
      <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Charts</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/charts"
                className="flex flex-col items-center hover:bg-accent/5 transition-colors rounded-lg"
                onClick={() => setNavigationOpen(false)}
              >
                <div
                  className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
                  style={top50Data?.target?.imageUrl ? { backgroundImage: `url(${top50Data.target.imageUrl})` } : undefined}
                >
                  {top50Data?.target?.imageUrl && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                      <span className="block truncate">{top50Data?.target?.name ?? 'Weekly Top 50'}</span>
                    </div>
                  )}
                  {!top50Data?.target?.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm mt-2 text-center">Weekly Top 50</p>
                <p className="text-xs text-muted-foreground text-center">Your 50 most played songs of the week</p>
              </a>

              <a
                href="/charts/ilovemondays"
                className="flex flex-col items-center hover:bg-accent/5 transition-colors rounded-lg"
                onClick={() => setNavigationOpen(false)}
              >
                <div
                  className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
                  style={data?.target?.imageUrl ? { backgroundImage: `url(${data.target.imageUrl})` } : undefined}
                >
                  {data?.target?.imageUrl ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                      <span className="block truncate">{data?.target?.name ?? 'I Love Mondays'}</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg">💙</span>
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm mt-2 text-center">I Love Mondays</p>
                <p className="text-xs text-muted-foreground text-center">Top 100 songs since Monday</p>
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

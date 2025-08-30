"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export default function ILoveMondaysSelectTargetPage(){
  const [playlists, setPlaylists] = useState<Array<{id:string; name:string; imageUrl?: string|null}>>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [targetName, setTargetName] = useState("Chartilly I Love Mondays");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/playlists")
      .then(r=>r.json())
      .then((j)=>{ if (Array.isArray(j.playlists)) setPlaylists(j.playlists); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  async function saveTarget(target: { playlistId?: string; playlistName?: string }){
    try{
      const res = await fetch('/api/charts/ilovemondays/target', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) });
      if(res.ok){ /* ok */ }
    }catch{}
  }

  return (
    <section className="p-4 space-y-4" aria-labelledby="title">
      <h1 id="title" className="mt-4 text-2xl md:text-3xl font-bold text-center pb-1 text-[hsl(var(--secondary-foreground))]">I Love Mondays</h1>
      <h2 className="text-lg md:text-xl font-semibold text-center pb-4 text-[hsl(var(--secondary-foreground))]">Choose the destination playlist</h2>

      <div className="grid grid-cols-3 gap-3">
        {/* Add tile */}
        <button
          className="w-full aspect-square rounded-md border-4 border-dashed flex items-center justify-center text-sm hover:bg-accent/10"
          onClick={() => setAddOpen(true)}
        >
          Add
        </button>
        {loading ? (
          Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-full aspect-square rounded-md overflow-hidden skeleton" aria-hidden />
          ))
        ) : (
          playlists.map(p => (
            <button
              key={p.id}
              className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
              style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
              onClick={async () => { setBusy(true); await saveTarget({ playlistId: p.id }); window.location.href = '/charts/ilovemondays?confirm=1'; }}
              aria-label={`Use ${p.name}`}
              title={p.name}
            >
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                <span className="block truncate">{p.name}</span>
              </div>
            </button>
          ))
        )}
      </div>

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
                <Button size="lg" disabled={busy} onClick={async ()=>{ const name = (targetName || '').trim() || 'Chartilly I Love Mondays'; setBusy(true); await saveTarget({ playlistName: name }); window.location.href = '/charts/ilovemondays?confirm=1'; }}>Confirm</Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

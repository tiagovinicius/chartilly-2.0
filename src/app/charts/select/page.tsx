"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export default function ChartsSelectTargetPage(){
  const [playlists, setPlaylists] = useState<Array<{id:string; name:string; imageUrl?: string|null}>>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [targetName, setTargetName] = useState("Chartilly Weekly Top 100");
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
      console.log('Attempting to save target:', target);
      const res = await fetch('/api/charts/top50/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      });

      console.log('Response status:', res.status);

      if(!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      console.log('Target saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving target:', error);
      throw error;
    }
  }

  async function saveTargetAndRedirect(target: { playlistId?: string; playlistName?: string }) {
    setBusy(true);
    try {
      console.log('Starting save process for:', target);

      // Save the target
      const saveResult = await saveTarget(target);
      console.log('Save completed, result:', saveResult);

      // Check if the save was successful by looking at the result
      if (saveResult && saveResult.ok) {
        console.log('Save confirmed successful, redirecting...');
        // Simple delay to ensure everything is processed
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = '/charts?confirm=1';
      } else {
        console.error('Save result indicates failure:', saveResult);
        alert('There was an issue saving your selection. Please try again.');
        setBusy(false);
      }
    } catch (error) {
      console.error('Error in saveTargetAndRedirect:', error);
      alert('There was an error saving your selection. Please try again.');
      setBusy(false);
    }
  }  return (
    <section className="p-4 space-y-4" aria-labelledby="title">
      <h1 id="title" className="mt-4 text-2xl md:text-3xl font-bold text-center pb-1 text-[hsl(var(--secondary-foreground))]">Weekly Top 100</h1>
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
              onClick={() => saveTargetAndRedirect({ playlistId: p.id })}
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
            <Input value={targetName} onChange={(e)=>setTargetName(e.target.value)} placeholder="Chartilly Weekly Top 100" />
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="ghost" size="lg">Cancel</Button>
              </SheetClose>
              <SheetClose asChild>
                <Button size="lg" disabled={busy} onClick={() => {
                  const name = (targetName || '').trim() || 'Chartilly Weekly Top 100';
                  saveTargetAndRedirect({ playlistName: name });
                }}>Confirm</Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

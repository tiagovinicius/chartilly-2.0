"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useAuthRedirect } from "@/lib/auth";

export default function ChartsSelectTargetPage(){
  const [playlists, setPlaylists] = useState<Array<{id:string; name:string; imageUrl?: string|null}>>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [targetName, setTargetName] = useState("Chartilly Weekly Top 100");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { handleAuthError } = useAuthRedirect();

  useEffect(() => {
    fetch("/api/playlists")
      .then(r=>r.json())
      .then((j)=>{
        // Handle authentication errors
        if (handleAuthError(j.error, "/charts/select")) {
          return; // Redirect happened
        }
        if (Array.isArray(j.playlists)) setPlaylists(j.playlists);
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [handleAuthError]);

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
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        console.error('Server error response:', errorData);

        // Check for authentication errors
        if (res.status === 401) {
          if (handleAuthError(errorData.error, "/charts/select")) {
            return; // Redirect happened
          }
        }

        // Throw with the server's message if available
        const message = errorData.message || errorData.error || `HTTP ${res.status}`;
        throw new Error(message);
      }

      const result = await res.json();
      console.log('Target saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving target:', error);
      throw error;
    }
  }  async function saveTargetAndRedirect(target: { playlistId?: string; playlistName?: string }) {
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
    } catch (error: any) {
      console.error('Error in saveTargetAndRedirect:', error);

      // More specific error messages
      if (error.message?.includes('401')) {
        alert('Your session has expired. Please log in again.');
      } else if (error.message?.includes('400')) {
        alert('Invalid selection. Please choose a valid playlist or name.');
      } else if (error.message?.includes('500')) {
        alert('Server error. Please try again in a moment.');
      } else {
        alert('There was an error saving your selection. Please try again.');
      }

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

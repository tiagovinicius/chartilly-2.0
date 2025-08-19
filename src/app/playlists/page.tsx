"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PlaylistsPage(){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{playlists: any[]; error?: string}>({playlists: []});

  useEffect(() => {
    fetch("/api/playlists").then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  }, []);

  return (
    <section className="p-4" aria-labelledby="title">
      <div className="mt-4 flex items-center justify-start pb-3">
        <Button type="button" variant="secondary" size="icon" className="rounded-full w-12 h-12" aria-label="Back" onClick={()=>router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      <h1 id="title" className="text-2xl md:text-3xl font-bold text-center pb-4 text-[hsl(var(--secondary-foreground))]">My playlists</h1>
      {data.error && <p role="alert" className="text-red-600">Error: {data.error}</p>}
      {loading ? (
        <div className="grid grid-cols-3 gap-3" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-full aspect-square rounded-md overflow-hidden skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {data.playlists.map((p:any) => (
            <a key={p.id} href={`/playlists/${p.id}`} className="block">
              <div
                className="w-full aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover relative"
                style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
                aria-label={p.name}
                title={p.name}
              >
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/60 text-white text-xs px-1 pt-6 pb-1.5">
                  <span className="block truncate">{p.name}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

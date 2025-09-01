"use client";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";

export default function PlaylistsPage(){
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{playlists: any[]; error?: string}>({playlists: []});
  const [initialized, setInitialized] = useState(false);
  const { handleAuthError } = useAuthRedirect();

  useEffect(() => {
    if (initialized) return; // Prevent re-execution

    setInitialized(true);

    fetch("/api/playlists")
      .then(r => r.json())
      .then((result) => {
        setData(result);

        // Handle authentication errors with automatic redirect
        if (handleAuthError(result.error, "/playlists")) {
          return; // Redirect happened, don't update loading state
        }
      })
      .finally(() => setLoading(false));
  }, []); // Remove handleAuthError from dependencies

  return (
    <section className="p-4" aria-labelledby="title">
  <h1 id="title" className="mt-4 text-2xl md:text-3xl font-bold text-center pb-4 text-[hsl(var(--secondary-foreground))]">My playlists</h1>
      {data.error === "unauthorized" || data.error === "no_token" ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Redirecting to login...</p>
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : data.error ? (
        <p role="alert" className="text-red-600">Error: {data.error}</p>
      ) : null}
      {loading ? (
        <div className="grid grid-cols-3 gap-3" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-full aspect-square rounded-md overflow-hidden skeleton" />
          ))}
        </div>
      ) : !data.error ? (
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
      ) : null}
    </section>
  );
}

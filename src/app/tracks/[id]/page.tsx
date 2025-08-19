"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackButton } from "@/app/components/back-button";

type TrackData = {
  title: string;
  albumImageUrl?: string | null;
  artists?: string[];
  albumName?: string | null;
  trackWiki?: string | null;
  albumWiki?: string | null;
  artistWiki?: string | null;
};

export default function TrackPage(){
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load(){
      setLoading(true);
      setError(null);
      try{
        const res = await fetch(`/api/tracks/${id}`);
        if (!res.ok) throw new Error("failed");
        const j = await res.json();
        if (!mounted) return;
        setData(j);
      } catch {
        if (!mounted) return;
        setError("Could not load details");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  return (
    <section className="p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl md:text-3xl font-bold text-center pb-4 text-[hsl(var(--secondary-foreground))]">
        {loading ? (
          <span className="inline-block h-7 w-48 rounded skeleton align-middle" aria-hidden />
        ) : (
          data?.title ?? "—"
        )}
      </h1>
      {error ? (
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      ) : (
        <>
          {loading ? (
            <div className="space-y-6" aria-hidden>
              <div className="flex items-center gap-4">
                <div className="w-32 aspect-square rounded-md skeleton flex-shrink-0" />
                <div className="min-w-0 space-y-2">
                  <div className="h-4 w-40 rounded skeleton" />
                  <div className="h-3 w-28 rounded skeleton" />
                </div>
              </div>
              {/* Section skeletons to mirror possible wikis */}
              <div className="space-y-3">
                <div className="h-6 w-48 rounded skeleton" />
                <div className="space-y-2">
                  <div className="h-3 w-11/12 rounded skeleton" />
                  <div className="h-3 w-10/12 rounded skeleton" />
                  <div className="h-3 w-8/12 rounded skeleton" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-6 w-48 rounded skeleton" />
                <div className="space-y-2">
                  <div className="h-3 w-11/12 rounded skeleton" />
                  <div className="h-3 w-9/12 rounded skeleton" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-32 aspect-square rounded-md overflow-hidden bg-muted/30 bg-center bg-cover flex-shrink-0" style={data?.albumImageUrl ? { backgroundImage: `url(${data.albumImageUrl})` } : undefined} />
              <div>
                <div className="text-sm text-muted-foreground">{Array.isArray(data?.artists) ? data!.artists!.join(', ') : ''}</div>
                {data?.albumName && <div className="text-sm">Album: <span className="font-medium">{data.albumName}</span></div>}
              </div>
            </div>
          )}

          {data?.trackWiki && (
            <div>
              <h2 className="text-2xl font-bold mb-1 text-[hsl(var(--primary))]">About the song</h2>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.trackWiki }} />
            </div>
          )}
          {data?.albumWiki && (
            <div>
              <h2 className="text-2xl font-bold mb-1 text-[hsl(var(--primary))]">About the album</h2>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.albumWiki }} />
            </div>
          )}
          {data?.artistWiki && (
            <div>
              <h2 className="text-2xl font-bold mb-1 text-[hsl(var(--primary))]">About the artist</h2>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.artistWiki }} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

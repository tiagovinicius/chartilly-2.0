import { headers } from "next/headers";

async function getTrack(id: string) {
  // Build absolute URL from incoming request headers and forward cookies for auth
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const cookie = h.get("cookie") ?? "";
  const res = await fetch(`${proto}://${host}/api/tracks/${id}`, {
    cache: 'no-store',
    headers: { cookie }
  });
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }){
  try {
  const { id } = await params;
  const data = await getTrack(id);
    return (
      <section className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <div className="flex items-center gap-4">
          <div className="w-32 aspect-square rounded-md bg-center bg-cover border" style={data.albumImageUrl ? { backgroundImage: `url(${data.albumImageUrl})` } : undefined} />
          <div>
            <div className="text-sm text-muted-foreground">{Array.isArray(data.artists) ? data.artists.join(', ') : ''}</div>
            {data.albumName && <div className="text-sm">Album: <span className="font-medium">{data.albumName}</span></div>}
          </div>
        </div>
        {data.trackWiki && (
          <div>
            <h2 className="text-lg font-semibold mb-1">About the song</h2>
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.trackWiki }} />
          </div>
        )}
        {data.albumWiki && (
          <div>
            <h2 className="text-lg font-semibold mb-1">About the album</h2>
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.albumWiki }} />
          </div>
        )}
        {data.artistWiki && (
          <div>
            <h2 className="text-lg font-semibold mb-1">About the artist</h2>
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.artistWiki }} />
          </div>
        )}
      </section>
    );
  } catch {
    return (
      <section className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Could not load details</h1>
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      </section>
    );
  }
}

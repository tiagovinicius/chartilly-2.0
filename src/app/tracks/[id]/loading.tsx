export default function Loading() {
  return (
    <section className="p-4 space-y-4">
      <div className="h-7 w-2/3 bg-muted/40 rounded animate-pulse" />
      <div className="flex items-center gap-4">
        <div className="w-32 aspect-square rounded-md bg-muted/30 border animate-pulse" />
        <div className="space-y-2 w-full max-w-md">
          <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-40 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-full bg-muted/20 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted/20 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-40 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-full bg-muted/20 rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-muted/20 rounded animate-pulse" />
      </div>
    </section>
  );
}

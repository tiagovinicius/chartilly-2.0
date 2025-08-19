export default function Loading() {
  return (
    <section className="p-4 space-y-4">
  <div className="h-7 w-2/3 rounded skeleton" />
    <div className="flex items-center gap-4">
  <div className="w-32 aspect-square rounded-md skeleton flex-shrink-0" />
        <div className="space-y-2 w-full max-w-md">
          <div className="h-4 w-3/4 rounded skeleton" />
          <div className="h-4 w-1/2 rounded skeleton" />
        </div>
      </div>
      <div className="space-y-2">
  <div className="h-5 w-40 rounded skeleton" />
  <div className="h-4 w-full rounded skeleton" />
  <div className="h-4 w-5/6 rounded skeleton" />
      </div>
      <div className="space-y-2">
  <div className="h-5 w-40 rounded skeleton" />
  <div className="h-4 w-full rounded skeleton" />
  <div className="h-4 w-4/6 rounded skeleton" />
      </div>
    </section>
  );
}

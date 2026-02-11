export default function ScoutingLoading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-1 h-3 w-24 animate-pulse rounded bg-white/5" />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Phase indicator skeleton */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>

        {/* Counter buttons skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="scout-panel p-4">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
              <div className="h-8 w-12 animate-pulse rounded bg-white/5" />
              <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

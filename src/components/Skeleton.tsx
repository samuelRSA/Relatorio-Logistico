export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-96 animate-pulse rounded-3xl bg-white/[0.06]" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-panel flex min-h-72 flex-col items-center justify-center rounded-3xl p-8 text-center">
      <div className="h-14 w-14 rounded-full border border-signal-blue/40 bg-signal-blue/10" />
      <h3 className="mt-5 font-display text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  );
}

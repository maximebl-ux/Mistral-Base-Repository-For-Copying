export default function Loading() {
  return (
    <div className="page-pad flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-3 border-t-brand" />
        <p className="text-sm text-ink-dim">Loading…</p>
      </div>
    </div>
  );
}

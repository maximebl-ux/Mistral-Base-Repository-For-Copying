"use client";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-surface-3 px-4 py-2 text-sm text-ink shadow-lg"
    >
      {message}
    </div>
  );
}

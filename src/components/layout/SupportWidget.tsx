"use client";

export default function SupportWidget() {
  return (
    <div className="group fixed right-6 bottom-6 z-50">
      <button
        type="button"
        aria-label="Support Help"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span className="text-lg font-bold">N</span>
      </button>
      <div className="pointer-events-none absolute top-1/2 right-full mr-4 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-800 px-3 py-1.5 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
        Need help?
      </div>
    </div>
  );
}

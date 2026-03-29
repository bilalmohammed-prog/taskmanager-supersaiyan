export function SupportWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <button
        type="button"
        className="h-12 w-12 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-white"
        aria-label="Support Help"
      >
        <span className="font-bold text-lg">N</span>
      </button>
      {/* Optional Hover Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 text-white text-xs rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Need help?
      </div>
    </div>
  );
}

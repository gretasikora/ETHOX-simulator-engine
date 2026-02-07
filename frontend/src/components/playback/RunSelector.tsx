import { useRef, useState, useEffect } from "react";
import type { PlaybackRun } from "../../types/playback";

interface RunSelectorProps {
  runs: PlaybackRun[];
  activeRunId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

export function RunSelector({
  runs,
  activeRunId,
  onSelect,
  className = "",
}: RunSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("click", onOutside);
      return () => document.removeEventListener("click", onOutside);
    }
  }, [open]);

  const activeRun = activeRunId ? runs.find((r) => r.id === activeRunId) : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-gray-200 hover:border-dark-500 hover:bg-dark-700"
      >
        <span className="text-gray-500">Run:</span>
        <span className="min-w-[8rem] truncate text-left">
          {activeRun?.name ?? "None"}
        </span>
        <span className="text-gray-500">▾</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 max-h-48 w-56 overflow-y-auto rounded-lg border border-dark-600 bg-dark-800 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-dark-700 hover:text-white"
          >
            None
          </button>
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => {
                onSelect(run.id);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-dark-700 ${
                run.id === activeRunId ? "bg-dark-700 text-white" : "text-gray-300"
              }`}
            >
              <span className="block truncate">{run.name}</span>
              <span className="text-xs text-gray-500">
                {run.frames.length} frames
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

export function PlaybackLegend() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-dark-600 bg-dark-800/95 shadow-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-200 hover:bg-dark-700"
      >
        <span>Playback Legend</span>
        <span className="text-gray-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="border-t border-dark-600 px-3 py-2 text-xs text-gray-400">
          <p className="mb-2">
            <strong className="text-gray-300">Node color (Opinion):</strong>{" "}
            Blue = negative, neutral = gray, orange = positive.
          </p>
          <p className="mb-2">
            <strong className="text-gray-300">Node size:</strong> Larger = higher adoption.
          </p>
          <p>
            <strong className="text-gray-300">Outline:</strong> Bright = high adoption; dashed/ring = targeted agent.
          </p>
        </div>
      )}
    </div>
  );
}

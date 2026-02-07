import { useCallback, useEffect, useRef } from "react";
import { usePlaybackStore, SPEED_OPTIONS } from "../../store/usePlaybackStore";

const FRAMES_PER_SECOND_BASE = 2;

export function PlaybackControls() {
  const runs = usePlaybackStore((s) => s.runs);
  const activeRunId = usePlaybackStore((s) => s.activeRunId);
  const t = usePlaybackStore((s) => s.t);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const setT = usePlaybackStore((s) => s.setT);
  const setPlaying = usePlaybackStore((s) => s.setPlaying);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);

  const run = activeRunId ? runs.find((r) => r.id === activeRunId) : null;
  const maxT = run?.frames.length ? run.frames.length - 1 : 0;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying || !run || run.frames.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const delayMs = 1000 / (FRAMES_PER_SECOND_BASE * speed);
    intervalRef.current = setInterval(() => {
      const { t: currentT, setT: setTStore, setPlaying: setPlayingStore } = usePlaybackStore.getState();
      const runState = usePlaybackStore.getState().runs.find((r) => r.id === activeRunId);
      const max = runState?.frames.length ? runState.frames.length - 1 : 0;
      if (currentT >= max) {
        setPlayingStore(false);
        return;
      }
      setTStore(currentT + 1);
    }, delayMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, run?.id, activeRunId, speed]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setT(Math.max(0, t - 1));
  }, [t, setT, setPlaying]);

  const stepForward = useCallback(() => {
    setPlaying(false);
    setT(Math.min(maxT, t + 1));
  }, [t, maxT, setT, setPlaying]);

  const togglePlay = useCallback(() => {
    if (!run?.frames.length) return;
    if (t >= maxT) setT(0);
    setPlaying(!isPlaying);
  }, [run, t, maxT, isPlaying, setPlaying, setT]);

  const disabled = !run || run.frames.length === 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={stepBack}
          disabled={disabled}
          className="rounded p-2 text-gray-400 hover:bg-dark-600 hover:text-white disabled:opacity-40"
          aria-label="Previous frame"
        >
          <span className="text-lg">⏮</span>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={disabled}
          className="rounded p-2 text-gray-400 hover:bg-dark-600 hover:text-white disabled:opacity-40"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <span className="text-xl">{isPlaying ? "⏸" : "▶"}</span>
        </button>
        <button
          type="button"
          onClick={stepForward}
          disabled={disabled}
          className="rounded p-2 text-gray-400 hover:bg-dark-600 hover:text-white disabled:opacity-40"
          aria-label="Next frame"
        >
          <span className="text-lg">⏭</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Day {t}</span>
        <input
          type="range"
          min={0}
          max={maxT || 0}
          step={1}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          disabled={disabled}
          className="h-2 w-32 accent-amber-500 disabled:opacity-40"
        />
        <span className="text-xs text-gray-500">Day {maxT}</span>
      </div>

      <div className="flex items-center gap-1 rounded border border-dark-600 p-0.5">
        <span className="px-2 text-xs text-gray-500">Speed</span>
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`rounded px-2 py-1 text-xs ${
              speed === s
                ? "bg-amber-500/30 text-amber-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

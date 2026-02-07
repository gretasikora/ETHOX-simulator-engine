import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "../utils/math";

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

export function RangeSlider({
  min,
  max,
  value: [low, high],
  onChange,
  step = 0.01,
}: RangeSliderProps) {
  const [dragging, setDragging] = useState<"low" | "high" | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const toPercent = useCallback(
    (v: number) => ((v - min) / (max - min || 1)) * 100,
    [min, max]
  );
  const fromPercent = useCallback(
    (p: number) => min + (p / 100) * (max - min),
    [min, max]
  );

  const handleRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!railRef.current) return;
    const rect = railRef.current.getBoundingClientRect();
    const p = ((e.clientX - rect.left) / rect.width) * 100;
    const v = fromPercent(p);
    if (Math.abs(v - low) <= Math.abs(v - high)) {
      onChange([clamp(v, min, high), high]);
    } else {
      onChange([low, clamp(v, low, max)]);
    }
  };

  const handleMove = useCallback(
    (e: MouseEvent) => {
      if (!railRef.current || dragging === null) return;
      const rect = railRef.current.getBoundingClientRect();
      const p = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
      const v = fromPercent(p);
      if (dragging === "low") {
        onChange([clamp(v, min, high - step), high]);
      } else {
        onChange([low, clamp(v, low + step, max)]);
      }
    },
    [dragging, low, high, min, max, step, onChange, fromPercent]
  );

  const handleUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging === null) return;
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, handleMove, handleUp]);

  return (
    <div className="space-y-1">
      <div
        ref={railRef}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={low}
        tabIndex={0}
        className="relative h-6 w-full cursor-pointer"
        onClick={handleRailClick}
        onMouseDown={(e) => {
          if (!railRef.current) return;
          const rect = railRef.current.getBoundingClientRect();
          const p = ((e.clientX - rect.left) / rect.width) * 100;
          const v = fromPercent(p);
          if (Math.abs(v - low) <= Math.abs(v - high)) setDragging("low");
          else setDragging("high");
        }}
      >
        <div className="absolute inset-y-0 left-0 right-0 rounded bg-aurora-surface2" />
        <div
          className="absolute inset-y-0 rounded bg-aurora-accent1"
          style={{
            left: `${toPercent(low)}%`,
            width: `${toPercent(high) - toPercent(low)}%`,
          }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-aurora-bg0 bg-aurora-accent1 shadow-aurora-glow-sm"
          style={{ left: `calc(${toPercent(low)}% - 8px)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging("low");
          }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-aurora-bg0 bg-aurora-accent1 shadow-aurora-glow-sm"
          style={{ left: `calc(${toPercent(high)}% - 8px)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging("high");
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-aurora-text2">
        <span>{typeof low === "number" && low % 1 !== 0 ? low.toFixed(2) : low}</span>
        <span>{typeof high === "number" && high % 1 !== 0 ? high.toFixed(2) : high}</span>
      </div>
    </div>
  );
}

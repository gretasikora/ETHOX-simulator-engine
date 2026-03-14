import { useEffect, useState } from "react";

const LOADING_TEXTS = [
  "Creating personas...",
  "Simulating reactions...",
  "Mapping connections...",
  "Assessing impact...",
];

const ROTATION_INTERVAL_MS = 2000; // Change text every 2 seconds

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-aurora-bg0/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Animated spinner */}
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-aurora-accent1/30 border-t-aurora-accent1" />
          <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-aurora-accent1/10" />
        </div>

        {/* Rotating text */}
        <div className="relative h-8 w-64">
          {LOADING_TEXTS.map((text, idx) => (
            <p
              key={text}
              className={`absolute inset-0 flex items-center justify-center text-xl font-medium text-aurora-text0 transition-all duration-500 ${
                idx === textIndex
                  ? "opacity-100 translate-y-0"
                  : idx === (textIndex - 1 + LOADING_TEXTS.length) % LOADING_TEXTS.length
                  ? "opacity-0 -translate-y-4"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {text}
            </p>
          ))}
        </div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-radial from-aurora-accent1/5 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

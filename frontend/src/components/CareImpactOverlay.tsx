interface CareImpactOverlayProps {
  visible: boolean;
  fading: boolean; // true when fading out (250ms)
  progress: number; // 0..1
}

export function CareImpactOverlay({ visible, fading, progress }: CareImpactOverlayProps) {
  if (!visible && !fading) return null;

  return (
    <div
      className={`absolute top-3 right-3 z-20 flex max-w-[220px] flex-col gap-2 rounded-xl border border-aurora-accent1/40 bg-aurora-surface1/95 px-3.5 py-2.5 shadow-aurora-glow-sm backdrop-blur-sm transition-opacity duration-[250ms] ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-xs font-medium text-aurora-text0">Applying event impact…</div>
      <div className="text-[11px] text-aurora-text2">Resizing nodes by level of care</div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-aurora-surface2/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-aurora-accent0 to-aurora-accent1 transition-all duration-100"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

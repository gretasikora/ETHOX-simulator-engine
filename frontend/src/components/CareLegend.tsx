interface CareLegendProps {
  visible: boolean;
}

export function CareLegend({ visible }: CareLegendProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-2 rounded-lg border border-aurora-border/50 bg-aurora-surface0/90 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-aurora-text2/90">
        Node size = Level of care
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="block rounded-full border border-aurora-accent1/50 bg-aurora-accent1/30"
            style={{ width: 6, height: 6 }}
            title="Low care"
          />
          <span className="text-[10px] text-aurora-text2">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="block rounded-full border border-aurora-accent1/70 bg-aurora-accent1/50"
            style={{ width: 12, height: 12 }}
            title="High care"
          />
          <span className="text-[10px] text-aurora-text2">High</span>
        </div>
      </div>
    </div>
  );
}

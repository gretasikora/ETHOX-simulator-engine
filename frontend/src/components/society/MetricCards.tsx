import type { StructuralMetrics, LiveMetrics } from "../../utils/metrics";

interface MetricCardsProps {
  structural: StructuralMetrics;
  live: LiveMetrics | null;
  liveDay0: LiveMetrics | null;
  currentDay: number;
}

function Card({
  title,
  value,
  caption,
  trend,
}: {
  title: string;
  value: string | number;
  caption: string;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border border-aurora-border bg-aurora-surface1 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-aurora-text2">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-aurora-text0">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-aurora-text2">{caption}</span>
        {trend != null && (
          <span className="rounded bg-aurora-surface2 px-1.5 py-0.5 text-xs text-aurora-success">{trend}</span>
        )}
      </div>
    </div>
  );
}

export function MetricCards({
  structural,
  live,
  liveDay0,
  currentDay,
}: MetricCardsProps) {
  const trendAdoption =
    live && liveDay0 && live.meanAdoption > liveDay0.meanAdoption
      ? `Δ +${(live.meanAdoption - liveDay0.meanAdoption).toFixed(2)} vs Day 0`
      : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Card
        title="Agents"
        value={structural.agentCount}
        caption="Structural"
      />
      <Card
        title="Edges"
        value={structural.edgeCount}
        caption="Structural"
      />
      <Card
        title="Density"
        value={structural.density.toFixed(3)}
        caption="Structural"
      />
      <Card
        title="Cohesion"
        value={structural.cohesion.toFixed(2)}
        caption="Within-cluster / total edges"
      />
      <Card
        title="External connectivity"
        value={structural.externalConnectivity.toFixed(2)}
        caption="1 − cohesion"
      />
      <Card
        title="Influence Gini"
        value={structural.giniInfluence.toFixed(2)}
        caption="Structural"
      />
      <Card
        title="Avg betweenness"
        value={structural.avgBetweenness.toFixed(4)}
        caption="Structural"
      />
      <Card
        title="Top 5% betweenness share"
        value={`${(structural.top5BetweennessShare * 100).toFixed(0)}%`}
        caption="Structural"
      />

      {live && (
        <>
          <Card
            title="Polarization"
            value={live.polarization.toFixed(2)}
            caption={`Live at Day ${currentDay}`}
          />
          <Card
            title="P90 − P10 opinion"
            value={live.polarizationP90P10.toFixed(2)}
            caption={`Live at Day ${currentDay}`}
          />
          <Card
            title="Mean adoption"
            value={live.meanAdoption.toFixed(2)}
            caption={`Live at Day ${currentDay}`}
            trend={trendAdoption}
          />
          <Card
            title="Adoption above 70%"
            value={`${(live.adoptionAbove70Share * 100).toFixed(0)}%`}
            caption={`${live.adoptionAbove70Pct} agents`}
          />
          <Card
            title="Mean opinion"
            value={live.meanOpinion.toFixed(2)}
            caption={`Live at Day ${currentDay}`}
          />
          <Card
            title="Opinion Gini"
            value={live.giniOpinion.toFixed(2)}
            caption={`Live at Day ${currentDay}`}
          />
        </>
      )}
    </div>
  );
}

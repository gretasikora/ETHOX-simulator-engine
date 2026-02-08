import type { StructuralMetrics, LiveMetrics } from "./metrics";

export type InsightSeverity = "info" | "watch" | "risk";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  metricRefs: string[];
  /** For tooltip: human-readable metric values used */
  metricValues?: Record<string, string | number>;
}

/** All thresholds in one place */
export const THRESHOLDS = {
  density: { loose: 0.02, dense: 0.15 },
  giniInfluence: { concentrated: 0.45, veryConcentrated: 0.6 },
  top5BetweennessShare: { highBrokerage: 0.6 },
  polarization: { high: 0.4, moderate: 0.25 },
  adoptionAbove70Share: { high: 0.3 },
  adoptionRateRise: 0.05,
} as const;

let insightIdCounter = 0;
function nextId(): string {
  return `insight-${++insightIdCounter}`;
}

export function generateInsights(
  structural: StructuralMetrics,
  live: LiveMetrics | null,
  liveAtDay0: LiveMetrics | null
): Insight[] {
  insightIdCounter = 0;
  const list: Insight[] = [];

  if (structural.density < THRESHOLDS.density.loose) {
    list.push({
      id: nextId(),
      severity: "watch",
      title: "Loose network",
      body: "Information may spread slowly across the society.",
      metricRefs: ["density"],
      metricValues: { density: structural.density.toFixed(3) },
    });
  } else if (structural.density > THRESHOLDS.density.dense) {
    list.push({
      id: nextId(),
      severity: "info",
      title: "Dense network",
      body: "Many connections between agents; ideas can diffuse quickly.",
      metricRefs: ["density"],
      metricValues: { density: structural.density.toFixed(3) },
    });
  }

  if (structural.giniInfluence > THRESHOLDS.giniInfluence.veryConcentrated) {
    list.push({
      id: nextId(),
      severity: "risk",
      title: "Highly concentrated influence",
      body: "Targeting a small set of agents could strongly shift outcomes; identify key influencers.",
      metricRefs: ["giniInfluence"],
      metricValues: { giniInfluence: structural.giniInfluence.toFixed(2) },
    });
  } else if (structural.giniInfluence > THRESHOLDS.giniInfluence.concentrated) {
    list.push({
      id: nextId(),
      severity: "info",
      title: "Influence is concentrated",
      body: "Targeting a small set of agents could shift outcomes.",
      metricRefs: ["giniInfluence"],
      metricValues: { giniInfluence: structural.giniInfluence.toFixed(2) },
    });
  }

  if (structural.top5BetweennessShare > THRESHOLDS.top5BetweennessShare.highBrokerage) {
    list.push({
      id: nextId(),
      severity: "risk",
      title: "High brokerage",
      body: "A few bridge agents connect communities; losing them could fragment the network.",
      metricRefs: ["top5BetweennessShare"],
      metricValues: { top5BetweennessShare: (structural.top5BetweennessShare * 100).toFixed(0) + "%" },
    });
  }

  list.push({
    id: nextId(),
    severity: "info",
    title: "Network size",
    body: `Society has ${structural.agentCount} agents and ${structural.edgeCount} connections.`,
    metricRefs: ["agentCount", "edgeCount"],
    metricValues: { agentCount: structural.agentCount, edgeCount: structural.edgeCount },
  });

  if (structural.avgBetweenness > 0.1) {
    list.push({
      id: nextId(),
      severity: "info",
      title: "Bridge potential",
      body: "Average betweenness suggests meaningful brokerage roles across the network.",
      metricRefs: ["avgBetweenness"],
      metricValues: { avgBetweenness: structural.avgBetweenness.toFixed(4) },
    });
  }

  if (live) {
    if (live.polarization > THRESHOLDS.polarization.high) {
      list.push({
        id: nextId(),
        severity: "risk",
        title: "Polarized sentiment",
        body: "Expect mixed reactions and rapid narrative splits in the simulation.",
        metricRefs: ["polarization"],
        metricValues: { polarization: live.polarization.toFixed(2) },
      });
    } else if (live.polarization > THRESHOLDS.polarization.moderate) {
      list.push({
        id: nextId(),
        severity: "watch",
        title: "Moderate opinion spread",
        body: "Opinions are diverging; monitor for emerging pockets of resistance or support.",
        metricRefs: ["polarization"],
        metricValues: { polarization: live.polarization.toFixed(2) },
      });
    }

    if (live.adoptionAbove70Share > THRESHOLDS.adoptionAbove70Share.high) {
      list.push({
        id: nextId(),
        severity: "info",
        title: "High adoption",
        body: `A large share of agents (${(live.adoptionAbove70Share * 100).toFixed(0)}%) have adoption above 70%.`,
        metricRefs: ["adoptionAbove70Share"],
        metricValues: { adoptionAbove70Share: (live.adoptionAbove70Share * 100).toFixed(0) + "%" },
      });
    }

    if (liveAtDay0 && live.meanAdoption - liveAtDay0.meanAdoption > THRESHOLDS.adoptionRateRise) {
      list.push({
        id: nextId(),
        severity: "info",
        title: "Adoption accelerating",
        body: "Adoption is rising over time in the simulation playback.",
        metricRefs: ["meanAdoption"],
        metricValues: {
          meanAdoptionNow: live.meanAdoption.toFixed(2),
          meanAdoptionDay0: liveAtDay0.meanAdoption.toFixed(2),
        },
      });
    }

    if (live.giniOpinion > 0.4) {
      list.push({
        id: nextId(),
        severity: "watch",
        title: "Opinion inequality",
        body: "Opinion is unevenly distributed; some agents hold much stronger views than others.",
        metricRefs: ["giniOpinion"],
        metricValues: { giniOpinion: live.giniOpinion.toFixed(2) },
      });
    }
  }

  return list.slice(0, 12);
}

export function formatInsightsForClipboard(insights: Insight[]): string {
  return insights
    .map((i) => `[${i.severity.toUpperCase()}] ${i.title}\n${i.body}`)
    .join("\n\n");
}

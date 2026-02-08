import type { NodeData, EdgeData } from "../api/client";
import type { AgentFrameState } from "../types/playback";

export interface StructuralMetrics {
  agentCount: number;
  edgeCount: number;
  density: number;
  giniInfluence: number;
  avgBetweenness: number;
  top5BetweennessShare: number;
}

export interface LiveMetrics {
  polarization: number;
  polarizationP90P10: number;
  meanAdoption: number;
  adoptionAbove70Pct: number;
  adoptionAbove70Share: number;
  meanOpinion: number;
  giniOpinion: number;
}

export interface SocietyMetrics {
  structural: StructuralMetrics;
  live?: LiveMetrics;
}

function getInfluenceScore(node: NodeData): number {
  const t = node.traits ?? {};
  const v = t.social_influence;
  if (typeof v === "number") return Math.max(0, Math.min(1, v));
  return node.degree_centrality ?? 0;
}

/** Gini coefficient 0..1 */
export function gini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let num = 0;
  for (let i = 0; i < n; i++) num += (2 * (i + 1) - n - 1) * sorted[i];
  return num / (n * sum);
}

export function computeStructuralMetrics(
  nodes: NodeData[],
  edges: EdgeData[]
): StructuralMetrics {
  const N = nodes.length;
  const E = edges.length;
  const maxEdges = N < 2 ? 0 : (N * (N - 1)) / 2;
  const density = maxEdges === 0 ? 0 : (2 * E) / (N * (N - 1));

  const influenceScores = nodes.map((n) => getInfluenceScore(n));
  const giniInfluence = gini(influenceScores);

  const betweennessList = nodes
    .map((n) => n.betweenness_centrality ?? 0)
    .filter((x) => Number.isFinite(x));
  const totalBetweenness = betweennessList.reduce((a, b) => a + b, 0);
  const avgBetweenness = betweennessList.length === 0 ? 0 : totalBetweenness / betweennessList.length;
  const sorted = [...betweennessList].sort((a, b) => b - a);
  const top5Count = Math.max(1, Math.floor(sorted.length * 0.05));
  const top5Sum = sorted.slice(0, top5Count).reduce((a, b) => a + b, 0);
  const top5BetweennessShare = totalBetweenness === 0 ? 0 : top5Sum / totalBetweenness;

  return {
    agentCount: N,
    edgeCount: E,
    density,
    giniInfluence,
    avgBetweenness,
    top5BetweennessShare,
  };
}

export function computeLiveMetrics(
  nodes: NodeData[],
  agents: Record<string, AgentFrameState>
): LiveMetrics {
  const opinions = nodes
    .map((n) => agents[String(n.agent_id)]?.opinion ?? 0)
    .filter((x) => Number.isFinite(x));
  const adoptions = nodes
    .map((n) => agents[String(n.agent_id)]?.adoption ?? 0)
    .filter((x) => Number.isFinite(x));

  const n = opinions.length;
  const meanOpinion = n === 0 ? 0 : opinions.reduce((a, b) => a + b, 0) / n;
  const variance = n === 0 ? 0 : opinions.reduce((a, o) => a + (o - meanOpinion) ** 2, 0) / n;
  const polarization = Math.sqrt(variance);

  const sortedOpinions = [...opinions].sort((a, b) => a - b);
  const p10Idx = Math.floor(n * 0.1);
  const p90Idx = Math.min(n - 1, Math.floor(n * 0.9));
  const polarizationP90P10 = n < 2 ? 0 : (sortedOpinions[p90Idx] ?? 0) - (sortedOpinions[p10Idx] ?? 0);

  const meanAdoption = adoptions.length === 0 ? 0 : adoptions.reduce((a, b) => a + b, 0) / adoptions.length;
  const adoptionAbove70Pct = adoptions.filter((x) => x > 0.7).length;
  const adoptionAbove70Share = adoptions.length === 0 ? 0 : adoptionAbove70Pct / adoptions.length;

  const opinionShifted = opinions.map((o) => (o + 1) / 2);
  const giniOpinion = gini(opinionShifted);

  return {
    polarization,
    polarizationP90P10,
    meanAdoption,
    adoptionAbove70Pct,
    adoptionAbove70Share,
    meanOpinion,
    giniOpinion,
  };
}


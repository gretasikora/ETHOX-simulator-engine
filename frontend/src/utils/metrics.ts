import type { NodeData, EdgeData } from "../api/client";
import type { AgentFrameState } from "../types/playback";

export interface StructuralMetrics {
  agentCount: number;
  edgeCount: number;
  density: number;
  withinClusterEdges: number;
  cohesion: number;
  externalConnectivity: number;
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
  clusterOpinions: { clusterId: number; meanOpinion: number; size: number }[];
  topPositiveClusters: { clusterId: number; meanOpinion: number; size: number }[];
  topNegativeClusters: { clusterId: number; meanOpinion: number; size: number }[];
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
  const nodeById = new Map<string, NodeData>();
  nodes.forEach((n) => nodeById.set(String(n.agent_id), n));

  let withinClusterEdges = 0;
  const edgeHasWithinCluster = "within_cluster" in (edges[0] ?? {});
  for (const e of edges) {
    const src = nodeById.get(String(e.source));
    const tgt = nodeById.get(String(e.target));
    if (edgeHasWithinCluster && typeof (e as EdgeData & { within_cluster?: boolean }).within_cluster === "boolean") {
      if ((e as EdgeData & { within_cluster: boolean }).within_cluster) withinClusterEdges++;
    } else if (src && tgt && src.cluster === tgt.cluster) {
      withinClusterEdges++;
    }
  }

  const maxEdges = N < 2 ? 0 : (N * (N - 1)) / 2;
  const density = maxEdges === 0 ? 0 : (2 * E) / (N * (N - 1));

  const cohesion = E === 0 ? 0 : withinClusterEdges / E;
  const externalConnectivity = 1 - cohesion;

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
    withinClusterEdges,
    cohesion,
    externalConnectivity,
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

  const clusterSums = new Map<number, { sum: number; count: number }>();
  for (const node of nodes) {
    const o = agents[String(node.agent_id)]?.opinion ?? 0;
    const c = node.cluster;
    const cur = clusterSums.get(c) ?? { sum: 0, count: 0 };
    clusterSums.set(c, { sum: cur.sum + o, count: cur.count + 1 });
  }
  const clusterOpinions = Array.from(clusterSums.entries()).map(([clusterId, { sum, count }]) => ({
    clusterId,
    meanOpinion: count === 0 ? 0 : sum / count,
    size: count,
  }));

  const byMean = [...clusterOpinions].sort((a, b) => b.meanOpinion - a.meanOpinion);
  const topPositiveClusters = byMean.slice(0, 3);
  const topNegativeClusters = [...clusterOpinions].sort((a, b) => a.meanOpinion - b.meanOpinion).slice(0, 3);

  return {
    polarization,
    polarizationP90P10,
    meanAdoption,
    adoptionAbove70Pct,
    adoptionAbove70Share,
    meanOpinion,
    giniOpinion,
    clusterOpinions,
    topPositiveClusters,
    topNegativeClusters,
  };
}

export interface ClusterRow {
  clusterId: number;
  size: number;
  internalEdges: number;
  totalEdgesInvolved: number;
  cohesionWithin: number;
  avgInfluence: number;
  meanOpinion?: number;
  adoptionShare?: number;
}

export function computeClusterBreakdown(
  nodes: NodeData[],
  edges: EdgeData[],
  agents?: Record<string, AgentFrameState>
): ClusterRow[] {
  const nodeById = new Map<string, NodeData>();
  nodes.forEach((n) => nodeById.set(String(n.agent_id), n));

  const clusterNodes = new Map<number, NodeData[]>();
  for (const n of nodes) {
    const list = clusterNodes.get(n.cluster) ?? [];
    list.push(n);
    clusterNodes.set(n.cluster, list);
  }

  const internalEdgesByCluster = new Map<number, number>();
  const totalEdgesByCluster = new Map<number, number>();
  for (const e of edges) {
    const src = nodeById.get(String(e.source));
    const tgt = nodeById.get(String(e.target));
    if (!src || !tgt) continue;
    const c1 = src.cluster;
    const c2 = tgt.cluster;
    totalEdgesByCluster.set(c1, (totalEdgesByCluster.get(c1) ?? 0) + 1);
    totalEdgesByCluster.set(c2, (totalEdgesByCluster.get(c2) ?? 0) + 1);
    if (c1 === c2) internalEdgesByCluster.set(c1, (internalEdgesByCluster.get(c1) ?? 0) + 1);
  }

  function getInfluence(n: NodeData) {
    const t = n.traits ?? {};
    const v = t.social_influence;
    if (typeof v === "number") return v;
    return n.degree_centrality ?? 0;
  }

  const rows: ClusterRow[] = [];
  for (const [clusterId, list] of clusterNodes) {
    const internalEdges = internalEdgesByCluster.get(clusterId) ?? 0;
    const totalEdgesInvolved = totalEdgesByCluster.get(clusterId) ?? 0;
    const cohesionWithin = totalEdgesInvolved === 0 ? 0 : internalEdges / totalEdgesInvolved;
    const avgInfluence =
      list.length === 0 ? 0 : list.reduce((a, n) => a + getInfluence(n), 0) / list.length;

    let meanOpinion: number | undefined;
    let adoptionShare: number | undefined;
    if (agents) {
      const opinions = list.map((n) => agents[String(n.agent_id)]?.opinion ?? 0);
      const adoptions = list.map((n) => agents[String(n.agent_id)]?.adoption ?? 0);
      meanOpinion = opinions.length ? opinions.reduce((a, b) => a + b, 0) / opinions.length : 0;
      adoptionShare = adoptions.length ? adoptions.filter((x) => x > 0.7).length / adoptions.length : 0;
    }

    rows.push({
      clusterId,
      size: list.length,
      internalEdges,
      totalEdgesInvolved,
      cohesionWithin,
      avgInfluence,
      meanOpinion,
      adoptionShare,
    });
  }
  return rows;
}

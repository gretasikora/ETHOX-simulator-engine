import type { NodeData, EdgeData } from "../api/client";

export function formatNumber(value: number, decimals: number): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : "—";
}

export interface ClusterStats {
  clusterId: number;
  nodeCount: number;
  avgDegree: number;
  cohesion: number;
  externalConnectivity: number;
  traitAverages: Record<string, number>;
  topInfluencers: NodeData[];
  bridgeNodes: NodeData[];
  oneLiner: string;
}

function getClusterNodes(nodes: NodeData[], clusterId: number): NodeData[] {
  return nodes.filter((n) => n.cluster === clusterId);
}

function getClusterNodeIds(nodes: NodeData[], clusterId: number): Set<string> {
  const set = new Set<string>();
  getClusterNodes(nodes, clusterId).forEach((n) => set.add(String(n.agent_id)));
  return set;
}

function computeCohesion(
  nodes: NodeData[],
  edges: EdgeData[],
  clusterId: number
): { cohesion: number; externalConnectivity: number } {
  const ids = getClusterNodeIds(nodes, clusterId);
  let within = 0;
  let totalInvolving = 0;
  for (const e of edges) {
    const s = String(e.source);
    const t = String(e.target);
    const inS = ids.has(s);
    const inT = ids.has(t);
    if (inS || inT) totalInvolving += 1;
    if (inS && inT) within += 1;
  }
  const cohesion = totalInvolving === 0 ? 0 : within / totalInvolving;
  const externalConnectivity = totalInvolving === 0 ? 0 : 1 - cohesion;
  return { cohesion, externalConnectivity };
}

function clusterTraitAverages(nodes: NodeData[], clusterId: number): Record<string, number> {
  const clusterNodes = getClusterNodes(nodes, clusterId);
  if (clusterNodes.length === 0) return {};
  const keys = new Set<string>();
  clusterNodes.forEach((n) => Object.keys(n.traits ?? {}).forEach((k) => keys.add(k)));
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const k of keys) {
    sums[k] = 0;
    counts[k] = 0;
    clusterNodes.forEach((n) => {
      const v = (n.traits ?? {})[k];
      if (v !== undefined) {
        sums[k] += v;
        counts[k] += 1;
      }
    });
  }
  const out: Record<string, number> = {};
  for (const k of keys) {
    out[k] = counts[k]! > 0 ? sums[k]! / counts[k]! : 0;
  }
  return out;
}

function generateOneLiner(stats: {
  cohesion: number;
  nodeCount: number;
  topInfluencers: NodeData[];
  bridgeNodes: NodeData[];
}): string {
  const highCohesion = stats.cohesion >= 0.6;
  const hasInfluencers = stats.topInfluencers.length > 0 && (stats.topInfluencers[0]?.betweenness_centrality ?? 0) > 0.1;
  const hasBridges = stats.bridgeNodes.length > 0;
  if (highCohesion && hasInfluencers) return "High cohesion, influencer-led cluster";
  if (highCohesion && !hasBridges) return "Tight-knit cluster with few external links";
  if (hasBridges && !highCohesion) return "Loose network with several bridges";
  if (hasBridges) return "Well-connected cluster with bridge nodes";
  if (stats.nodeCount <= 3) return "Small cluster";
  return "Moderate cohesion cluster";
}

export function computeClusterStats(
  nodes: NodeData[],
  edges: EdgeData[],
  clusterFilter: number[]
): ClusterStats[] {
  const clusterIds = new Set<number>(nodes.map((n) => n.cluster));
  const finalIds =
    clusterFilter.length > 0
      ? clusterFilter.filter((id) => clusterIds.has(id))
      : Array.from(clusterIds);

  const result: ClusterStats[] = [];
  for (const cid of finalIds) {
    const clusterNodes = getClusterNodes(nodes, cid);
    if (clusterNodes.length === 0) continue;
    const { cohesion, externalConnectivity } = computeCohesion(nodes, edges, cid);
    const avgDegree =
      clusterNodes.reduce((s, n) => s + (n.degree ?? 0), 0) / clusterNodes.length;
    const traitAverages = clusterTraitAverages(nodes, cid);
    const byBetweenness = [...clusterNodes].sort(
      (a, b) => (b.betweenness_centrality ?? 0) - (a.betweenness_centrality ?? 0)
    );
    const byDegreeCentrality = [...clusterNodes].sort(
      (a, b) => (b.degree_centrality ?? 0) - (a.degree_centrality ?? 0)
    );
    const topInfluencers = byBetweenness.slice(0, 3);
    if (topInfluencers.length < 3) {
      const used = new Set(topInfluencers.map((n) => String(n.agent_id)));
      for (const n of byDegreeCentrality) {
        if (used.has(String(n.agent_id))) continue;
        topInfluencers.push(n);
        if (topInfluencers.length >= 3) break;
      }
    }
    const bridgeNodes = byBetweenness.slice(0, 3);
    const oneLiner = generateOneLiner({
      cohesion,
      nodeCount: clusterNodes.length,
      topInfluencers,
      bridgeNodes,
    });
    result.push({
      clusterId: cid,
      nodeCount: clusterNodes.length,
      avgDegree,
      cohesion,
      externalConnectivity,
      traitAverages,
      topInfluencers: topInfluencers.slice(0, 3),
      bridgeNodes: bridgeNodes.slice(0, 3),
      oneLiner,
    });
  }
  return result;
}


import type { NodeData, EdgeData } from "../api/client";
import type { Experiment, ExperimentTargetParams } from "../types/experiment";

const STORAGE_KEY = "society-explorer-experiments";

export function loadExperimentsFromStorage(): Experiment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExperimentsToStorage(experiments: Experiment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
  } catch {
    // ignore
  }
}

export function computeCrossClusterEdgeCounts(
  nodes: NodeData[],
  edges: EdgeData[]
): Map<string, number> {
  const byId = new Map<string, NodeData>();
  nodes.forEach((n) => byId.set(String(n.agent_id), n));
  const count = new Map<string, number>();
  nodes.forEach((n) => count.set(String(n.agent_id), 0));
  for (const e of edges) {
    const s = String(e.source);
    const t = String(e.target);
    const nodeS = byId.get(s);
    const nodeT = byId.get(t);
    if (!nodeS || !nodeT) continue;
    if (nodeS.cluster !== nodeT.cluster) {
      count.set(s, (count.get(s) ?? 0) + 1);
      count.set(t, (count.get(t) ?? 0) + 1);
    }
  }
  return count;
}

function getInfluenceScore(node: NodeData, metric: ExperimentTargetParams["metric"]): number {
  if (metric === "social_influence") {
    const v = (node.traits ?? {}).social_influence;
    if (typeof v === "number") return v;
    return node.degree_centrality ?? 0;
  }
  if (metric === "betweenness_centrality") return node.betweenness_centrality ?? 0;
  return node.degree_centrality ?? 0;
}

export function computeTargets(
  experiment: Experiment,
  nodes: NodeData[],
  edges: EdgeData[]
): string[] {
  const { targetMode, targetParams } = experiment;
  const params = targetParams ?? {};

  if (targetMode === "all") {
    return nodes.map((n) => String(n.agent_id));
  }

  if (targetMode === "clusters") {
    const clusterSet = new Set(params.clusters ?? []);
    if (clusterSet.size === 0) return [];
    return nodes
      .filter((n) => clusterSet.has(n.cluster))
      .map((n) => String(n.agent_id));
  }

  if (targetMode === "top_influencers") {
    const metric = params.metric ?? "social_influence";
    const topN = Math.max(1, Math.min(50, params.topN ?? 10));
    const sorted = [...nodes].sort(
      (a, b) => getInfluenceScore(b, metric) - getInfluenceScore(a, metric)
    );
    return sorted.slice(0, topN).map((n) => String(n.agent_id));
  }

  if (targetMode === "bridge_nodes") {
    const method = params.bridgeMethod ?? "betweenness";
    const topN = Math.max(1, Math.min(50, params.topN ?? 10));
    if (method === "betweenness") {
      const sorted = [...nodes].sort(
        (a, b) => (b.betweenness_centrality ?? 0) - (a.betweenness_centrality ?? 0)
      );
      return sorted.slice(0, topN).map((n) => String(n.agent_id));
    }
    const crossCounts = computeCrossClusterEdgeCounts(nodes, edges);
    const sorted = [...nodes].sort(
      (a, b) => (crossCounts.get(String(b.agent_id)) ?? 0) - (crossCounts.get(String(a.agent_id)) ?? 0)
    );
    return sorted.slice(0, topN).map((n) => String(n.agent_id));
  }

  if (targetMode === "manual") {
    return params.manualIds ?? [];
  }

  return [];
}

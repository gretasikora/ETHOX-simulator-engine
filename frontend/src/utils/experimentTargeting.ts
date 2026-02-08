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
  _edges: EdgeData[]
): string[] {
  const { targetMode, targetParams } = experiment;
  const params = targetParams ?? {};

  if (targetMode === "all") {
    return nodes.map((n) => String(n.agent_id));
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
    const topN = Math.max(1, Math.min(50, params.topN ?? 10));
    const sorted = [...nodes].sort(
      (a, b) => (b.betweenness_centrality ?? 0) - (a.betweenness_centrality ?? 0)
    );
    return sorted.slice(0, topN).map((n) => String(n.agent_id));
  }

  if (targetMode === "manual") {
    return params.manualIds ?? [];
  }

  return [];
}

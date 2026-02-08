import type { NodeData, EdgeData } from "../api/client";
import type { GraphFilters } from "./graph";

export interface FGNode {
  id: string;
  agent_id: string;
  age?: number;
  gender?: string;
  degree?: number;
  degree_centrality?: number;
  betweenness_centrality?: number;
  traits?: Record<string, number>;
  level_of_care?: number;
}

export interface FGLink {
  source: string;
  target: string;
  value?: number;
}

const MAX_3D_NODES = 3000;

function isNodeVisible(
  node: NodeData,
  filters: GraphFilters,
  selectedTrait: string
): boolean {
  const degree = node.degree ?? 0;
  if (degree < filters.degreeRange[0] || degree > filters.degreeRange[1]) {
    return false;
  }
  if (selectedTrait && node.traits && typeof node.traits === "object") {
    const v = node.traits[selectedTrait];
    if (
      v !== undefined &&
      (v < filters.traitRange[0] || v > filters.traitRange[1])
    ) {
      return false;
    }
  }
  return true;
}

function toFGNode(node: NodeData): FGNode {
  return {
    id: String(node.agent_id),
    agent_id: String(node.agent_id),
    age: node.age,
    gender: node.gender,
    degree: node.degree,
    degree_centrality: node.degree_centrality,
    betweenness_centrality: node.betweenness_centrality,
    traits: node.traits ? { ...node.traits } : undefined,
    level_of_care: node.level_of_care,
  };
}

/**
 * Export the currently visible (filtered) graph for react-force-graph-3d.
 * Uses the same visibility logic as applyFilters.
 * Caps at MAX_3D_NODES; if capped, takes nodes by degree (desc) and sets capped: true.
 */
export function exportVisibleGraphToForceGraphData(
  nodes: NodeData[],
  edges: EdgeData[],
  filters: GraphFilters,
  selectedTrait: string
): { nodes: FGNode[]; links: FGLink[]; capped: boolean } {
  const visibleIds = new Set<string>();
  for (const node of nodes) {
    if (isNodeVisible(node, filters, selectedTrait)) {
      visibleIds.add(String(node.agent_id));
    }
  }

  const visibleNodes = nodes.filter((n) => visibleIds.has(String(n.agent_id)));
  let fgNodes: FGNode[] = visibleNodes.map(toFGNode);

  let capped = false;
  if (fgNodes.length > MAX_3D_NODES) {
    capped = true;
    const byDegree = [...fgNodes].sort(
      (a, b) => (b.degree ?? 0) - (a.degree ?? 0)
    );
    fgNodes = byDegree.slice(0, MAX_3D_NODES);
    const capIds = new Set(fgNodes.map((n) => n.id));
    visibleIds.clear();
    capIds.forEach((id) => visibleIds.add(id));
  }

  const links: FGLink[] = [];
  for (const edge of edges) {
    const s = String(edge.source);
    const t = String(edge.target);
    if (visibleIds.has(s) && visibleIds.has(t)) {
      links.push({
        source: s,
        target: t,
        value: edge.weight ?? 1,
      });
    }
  }

  return { nodes: fgNodes, links, capped };
}

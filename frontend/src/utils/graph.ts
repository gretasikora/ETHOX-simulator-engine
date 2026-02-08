import Graph from "graphology";
import type { NodeData, EdgeData } from "../api/client";
import { getAgeColor, getGenderShape, getGradientColor } from "./color";
import { scaleLinear } from "./math";
import { computeCareSize } from "./careSizing";

export interface GraphFilters {
  clusters: number[];
  degreeRange: [number, number];
  traitRange: [number, number];
}

export interface GraphUIState {
  colorBy: "age" | "trait" | "centrality";
  sizeBy: "degree" | "centrality" | "level_of_care";
  selectedTrait: string;
  traitKeys: string[];
  filters: GraphFilters;
  showAgeEncoding: boolean;
  showGenderEncoding: boolean;
}

function getMaxDegree(nodes: NodeData[]): number {
  if (nodes.length === 0) return 1;
  return Math.max(1, ...nodes.map((n) => n.degree));
}

function getMaxCentrality(nodes: NodeData[]): number {
  if (nodes.length === 0) return 1;
  return Math.max(0.01, ...nodes.map((n) => n.degree_centrality ?? 0));
}

/** Min centrality so gradient uses full data range (better color variation). */
function getMinCentrality(nodes: NodeData[]): number {
  if (nodes.length === 0) return 0;
  return Math.min(...nodes.map((n) => n.degree_centrality ?? 0));
}

export function buildGraphology(
  nodes: NodeData[],
  edges: EdgeData[],
  uiState: GraphUIState
): Graph {
  const graph = new Graph({ type: "undirected", multi: false });
  const maxDegree = getMaxDegree(nodes);
  const maxCentrality = getMaxCentrality(nodes);
  const minCentrality = getMinCentrality(nodes);
  const centralityRange = Math.max(0.001, maxCentrality - minCentrality);
  const { colorBy, sizeBy, selectedTrait, showAgeEncoding, showGenderEncoding } = uiState;

  for (const node of nodes) {
    const id = String(node.agent_id);
    const traits = node.traits && typeof node.traits === "object" ? node.traits : {};
    let size = 8;
    if (sizeBy === "degree") {
      size = scaleLinear(node.degree ?? 0, 0, maxDegree, 3, 15);
    } else if (sizeBy === "level_of_care") {
      const loc = node.level_of_care ?? 0.5;
      size = computeCareSize(loc, 8);
    } else {
      size = scaleLinear(node.degree_centrality ?? 0, 0, maxCentrality, 3, 15);
    }
    let color: string;
    if (colorBy === "trait" && selectedTrait) {
      const v = traits[selectedTrait];
      color = getGradientColor(v !== undefined ? v : 0.5, 0, 1);
    } else if (colorBy === "centrality") {
      color = getGradientColor(node.degree_centrality ?? 0, minCentrality, minCentrality + centralityRange);
    } else if (colorBy === "age" && showAgeEncoding && node.age != null && Number.isFinite(node.age)) {
      color = getAgeColor(node.age);
    } else {
      color = getGradientColor(node.degree_centrality ?? 0, minCentrality, minCentrality + centralityRange);
    }
    const shape = showGenderEncoding ? getGenderShape(node.gender) : "circle";
    graph.addNode(id, {
      label: "Agent " + id,
      x: 0,
      y: 0,
      size,
      color,
      type: shape,
      cluster: node.cluster ?? 0,
      degree: node.degree ?? 0,
      degree_centrality: node.degree_centrality ?? 0,
      betweenness_centrality: node.betweenness_centrality ?? 0,
      traits: { ...traits },
      age: node.age,
      gender: node.gender,
      level_of_care: node.level_of_care,
      hidden: false,
    });
  }

  for (const edge of edges) {
    const s = String(edge.source);
    const t = String(edge.target);
    if (graph.hasNode(s) && graph.hasNode(t) && !graph.hasEdge(s, t)) {
      graph.addEdge(s, t, {
        weight: edge.weight ?? 1,
        color: "rgba(255,255,255,0.08)",
        hidden: false,
      });
    }
  }

  return graph;
}

export function applyFilters(
  graph: Graph,
  filters: GraphFilters,
  selectedTrait: string
): void {
  graph.forEachNode((node) => {
    const attrs = graph.getNodeAttributes(node);
    let visible = true;
    if (filters.clusters.length > 0 && !filters.clusters.includes(attrs.cluster as number)) {
      visible = false;
    }
    const degree = (attrs.degree as number) ?? 0;
    if (degree < filters.degreeRange[0] || degree > filters.degreeRange[1]) {
      visible = false;
    }
    if (selectedTrait && attrs.traits && typeof attrs.traits === "object") {
      const traits = attrs.traits as Record<string, number>;
      const v = traits[selectedTrait];
      if (v !== undefined && (v < filters.traitRange[0] || v > filters.traitRange[1])) {
        visible = false;
      }
    }
    graph.setNodeAttribute(node, "hidden", !visible);
  });

  graph.forEachEdge((edge) => {
    const [source, target] = graph.extremities(edge);
    const sourceHidden = graph.getNodeAttribute(source, "hidden");
    const targetHidden = graph.getNodeAttribute(target, "hidden");
    graph.setEdgeAttribute(edge, "hidden", sourceHidden || targetHidden);
  });
}

export function applyVisualAttributes(
  graph: Graph,
  colorBy: "age" | "trait" | "centrality",
  sizeBy: "degree" | "centrality" | "level_of_care",
  selectedTrait: string,
  _traitKeys: string[],
  _clusterColors: string[],
  showAgeEncoding: boolean,
  showGenderEncoding: boolean
): void {
  let minCentrality = Infinity;
  let maxCentrality = 0;
  let maxDegree = 0;
  graph.forEachNode((_n, attrs) => {
    const dc = (attrs.degree_centrality as number) ?? 0;
    const d = (attrs.degree as number) ?? 0;
    if (dc < minCentrality) minCentrality = dc;
    if (dc > maxCentrality) maxCentrality = dc;
    if (d > maxDegree) maxDegree = d;
  });
  if (minCentrality === Infinity) minCentrality = 0;
  const centralityRange = Math.max(0.001, maxCentrality - minCentrality);
  if (maxDegree === 0) maxDegree = 1;

  graph.forEachNode((node) => {
    const attrs = graph.getNodeAttributes(node);
    const age = attrs.age as number | undefined;
    let color: string;
    if (colorBy === "trait" && selectedTrait) {
      const traits = (attrs.traits as Record<string, number>) || {};
      const v = traits[selectedTrait];
      color = getGradientColor(v ?? 0.5, 0, 1);
    } else if (colorBy === "centrality") {
      const dc = (attrs.degree_centrality as number) ?? 0;
      color = getGradientColor(dc, minCentrality, minCentrality + centralityRange);
    } else if (colorBy === "age" && showAgeEncoding && age != null && Number.isFinite(age)) {
      color = getAgeColor(age);
    } else {
      const dc = (attrs.degree_centrality as number) ?? 0;
      color = getGradientColor(dc, minCentrality, minCentrality + centralityRange);
    }
    let size = 8;
    if (sizeBy === "degree") {
      size = scaleLinear((attrs.degree as number) ?? 0, 0, maxDegree, 3, 15);
    } else if (sizeBy === "level_of_care") {
      const loc = (attrs.level_of_care as number) ?? 0.5;
      size = computeCareSize(loc, 8);
    } else {
      size = scaleLinear((attrs.degree_centrality as number) ?? 0, 0, maxCentrality, 3, 15);
    }
    const shape = showGenderEncoding ? getGenderShape(attrs.gender as string | undefined) : "circle";
    graph.setNodeAttribute(node, "color", color);
    graph.setNodeAttribute(node, "size", size);
    graph.setNodeAttribute(node, "type", shape);
  });

  graph.forEachEdge((edge) => {
    graph.setEdgeAttribute(edge, "color", "rgba(255,255,255,0.05)");
  });
}

export function exportFilteredSubgraph(graph: Graph): {
  nodes: NodeData[];
  edges: { source: string; target: string; weight: number }[];
} {
  const nodes: NodeData[] = [];
  const edges: { source: string; target: string; weight: number }[] = [];
  const visibleNodes = new Set<string>();

  graph.forEachNode((node) => {
    const hidden = graph.getNodeAttribute(node, "hidden");
    if (hidden) return;
    visibleNodes.add(node);
    const attrs = graph.getNodeAttributes(node);
    nodes.push({
      agent_id: node,
      degree: (attrs.degree as number) ?? 0,
      cluster: (attrs.cluster as number) ?? 0,
      traits: ((attrs.traits as Record<string, number>) || {}),
      degree_centrality: (attrs.degree_centrality as number) ?? 0,
      betweenness_centrality: (attrs.betweenness_centrality as number) ?? 0,
      age: attrs.age as number | undefined,
      gender: attrs.gender as string | undefined,
    });
  });

  graph.forEachEdge((edge) => {
    const hidden = graph.getEdgeAttribute(edge, "hidden");
    if (hidden) return;
    const [source, target] = graph.extremities(edge);
    if (!visibleNodes.has(source) || !visibleNodes.has(target)) return;
    const weight = (graph.getEdgeAttribute(edge, "weight") as number) ?? 1;
    edges.push({ source, target, weight });
  });

  return { nodes, edges };
}

import { useEffect, useRef, useCallback } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import { random as randomLayout } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useGraphStore } from "../store/useGraphStore";
import { useUIStore } from "../store/useUIStore";
import {
  buildGraphology,
  applyFilters,
  applyVisualAttributes,
  type GraphUIState,
} from "../utils/graph";
import { CLUSTER_COLORS, hexToRgba } from "../utils/color";

interface GraphCanvasProps {
  graphRef: React.MutableRefObject<Graph | null>;
  onSigmaReady: (resetCamera: () => void) => void;
}

export function GraphCanvas({ graphRef, onSigmaReady }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphInstanceRef = useRef<Graph | null>(null);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const traitKeys = useGraphStore((s) => s.traitKeys);

  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const hoveredNodeId = useUIStore((s) => s.hoveredNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const setVisibleNodeIds = useUIStore((s) => s.setVisibleNodeIds);
  const colorBy = useUIStore((s) => s.colorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const showLabels = useUIStore((s) => s.showLabels);
  const filters = useUIStore((s) => s.filters);

  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  hoveredRef.current = hoveredNodeId;
  selectedRef.current = selectedNodeId;

  const resetCamera = useCallback(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    const camera = sigma.getCamera();
    if (typeof camera.animatedReset === "function") {
      camera.animatedReset({ duration: 600 });
    } else if (typeof camera.animate === "function") {
      camera.animate({ x: 0.5, y: 0.5, ratio: 1 }, { duration: 600 });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const uiState: GraphUIState = {
      colorBy,
      sizeBy,
      selectedTrait: selectedTrait || traitKeys[0] || "",
      traitKeys,
      filters,
    };
    const graph = buildGraphology(nodes, edges, uiState);

    randomLayout.assign(graph);
    forceAtlas2.assign(graph, {
      iterations: 300,
      settings: {
        gravity: 1,
        scalingRatio: 2,
        barnesHutOptimize: graph.order > 200,
      },
    });

    graphRef.current = graph;
    graphInstanceRef.current = graph;

    const settings: Partial<{
      renderEdgeLabels: boolean;
      defaultEdgeType: string;
      defaultNodeColor: string;
      defaultEdgeColor: string;
      minCameraRatio: number;
      maxCameraRatio: number;
      labelColor: { color: string };
      labelFont: string;
      labelSize: number;
      labelRenderedSizeThreshold: number;
      nodeReducer: (node: string, data: Record<string, unknown>) => Record<string, unknown>;
      edgeReducer: (edge: string, data: Record<string, unknown>) => Record<string, unknown>;
    }> = {
      renderEdgeLabels: false,
      defaultEdgeType: "line",
      defaultNodeColor: "#6366f1",
      defaultEdgeColor: "rgba(255,255,255,0.06)",
      minCameraRatio: 0.08,
      maxCameraRatio: 3,
      labelColor: { color: "#e5e7eb" },
      labelFont: "Inter, system-ui, sans-serif",
      labelSize: 12,
      labelRenderedSizeThreshold: showLabels ? 0 : 999,
      nodeReducer: (node, data) => {
        const attrs = graph.getNodeAttributes(node);
        if (attrs.hidden) return { ...data, hidden: true };
        const hovered = hoveredRef.current;
        const selected = selectedRef.current;
        const isHighlight = node === hovered || node === selected;
        const neighbors = selected || hovered
          ? new Set(
              graph.neighbors(selected || hovered || "")
            )
          : null;
        const isNeighbor =
          (selected || hovered) &&
          node !== selected &&
          node !== hovered &&
          neighbors?.has(node);
        if (isHighlight) {
          return { ...data, size: (data.size as number) * 1.3, label: data.label };
        }
        if (isNeighbor) return data;
        if (selected || hovered) {
          const c = data.color as string;
          const dimColor = c.startsWith("#") ? hexToRgba(c, 0.15) : c.replace(")", ", 0.15)").replace("rgb", "rgba");
          return {
            ...data,
            color: dimColor,
            size: Math.max(2, (data.size as number) * 0.5),
            label: "",
          };
        }
        return data;
      },
      edgeReducer: (edge, data) => {
        if (graph.getEdgeAttribute(edge, "hidden")) return { ...data, hidden: true };
        const [source, target] = graph.extremities(edge);
        const focus = selectedRef.current || hoveredRef.current;
        const connected =
          focus && (source === focus || target === focus);
        if (connected)
          return { ...data, color: "rgba(255,255,255,0.4)" };
        if (focus)
          return { ...data, color: "rgba(255,255,255,0.02)" };
        return data;
      },
    };

    const sigma = new Sigma(graph, containerRef.current, settings);
    sigmaRef.current = sigma;

    sigma.on("enterNode", ({ node }) => setHoveredNode(node));
    sigma.on("leaveNode", () => setHoveredNode(null));
    sigma.on("clickNode", ({ node }) => setSelectedNode(node != null ? String(node) : null));
    sigma.on("clickStage", () => setSelectedNode(null));

    onSigmaReady(resetCamera);

    return () => {
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
      graphInstanceRef.current = null;
    };
  }, [nodes, edges]);

  useEffect(() => {
    const graph = graphInstanceRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;

    applyFilters(graph, filters, selectedTrait || traitKeys[0] || "");
    applyVisualAttributes(
      graph,
      colorBy,
      sizeBy,
      selectedTrait || traitKeys[0] || "",
      traitKeys,
      CLUSTER_COLORS
    );
    const visibleIds: string[] = [];
    graph.forEachNode((node) => {
      if (!graph.getNodeAttribute(node, "hidden")) visibleIds.push(node);
    });
    setVisibleNodeIds(visibleIds);
  }, [colorBy, sizeBy, selectedTrait, traitKeys, filters, setVisibleNodeIds]);

  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    sigma.setSetting(
      "labelRenderedSizeThreshold",
      showLabels ? 0 : 999
    );
  }, [showLabels]);

  // Do not animate camera on node select - it zoomed in too far (ratio 0.3) and
  // made the rest of the network disappear. The selected node is still highlighted
  // by the node reducer; the drawer shows details without changing the view.

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="absolute inset-0 bg-dark-900"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

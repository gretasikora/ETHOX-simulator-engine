import { useEffect, useRef, useCallback, useMemo } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import { random as randomLayout } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useGraphStore } from "../store/useGraphStore";
import { useUIStore } from "../store/useUIStore";
import { useExperimentStore } from "../store/useExperimentStore";
import { usePlaybackStore } from "../store/usePlaybackStore";
import {
  buildGraphology,
  applyFilters,
  applyVisualAttributes,
  type GraphUIState,
} from "../utils/graph";
import { CLUSTER_COLORS, hexToRgba, getOpinionColor } from "../utils/color";
import { edgeKey } from "../utils/graphAlgorithms";

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
  const exploreMode = useUIStore((s) => s.exploreMode);
  const pathFrom = useUIStore((s) => s.pathFrom);
  const pathTo = useUIStore((s) => s.pathTo);
  const highlightedNodeIds = useUIStore((s) => s.highlightedNodeIds);
  const highlightedEdgeKeys = useUIStore((s) => s.highlightedEdgeKeys);
  const setPathFrom = useUIStore((s) => s.setPathFrom);
  const setPathTo = useUIStore((s) => s.setPathTo);
  const setNeighborhoodCenter = useUIStore((s) => s.setNeighborhoodCenter);

  const appliedTargetIds = useExperimentStore((s) => s.appliedTargetIds);
  const experimentPanelOpen = useExperimentStore((s) => s.experimentPanelOpen);
  const activeExperimentId = useExperimentStore((s) => s.activeExperimentId);
  const experiments = useExperimentStore((s) => s.experiments);
  const toggleManualTarget = useExperimentStore((s) => s.toggleManualTarget);

  const activeExperiment = activeExperimentId
    ? experiments.find((e) => e.id === activeExperimentId)
    : null;
  const isManualTargetMode =
    experimentPanelOpen && activeExperiment?.targetMode === "manual";

  const playbackRunId = usePlaybackStore((s) => s.activeRunId);
  const playbackT = usePlaybackStore((s) => s.t);
  const playbackRuns = usePlaybackStore((s) => s.runs);
  const playbackColorMode = usePlaybackStore((s) => s.colorMode);

  const playbackAgentState = useMemo(() => {
    const run = playbackRunId ? playbackRuns.find((r) => r.id === playbackRunId) : null;
    if (!run?.frames?.length) return null;
    const frame = run.frames[Math.min(playbackT, run.frames.length - 1)];
    return frame?.agents ?? null;
  }, [playbackRunId, playbackT, playbackRuns]);

  const playbackTargetedIds = useMemo(() => {
    const run = playbackRunId ? playbackRuns.find((r) => r.id === playbackRunId) : null;
    const ids = run?.meta?.targetedAgentIds;
    return ids ? ids.map((id) => String(id)) : [];
  }, [playbackRunId, playbackRuns]);

  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const highlightNodesRef = useRef<string[]>([]);
  const highlightEdgesRef = useRef<string[]>([]);
  const appliedTargetIdsRef = useRef<string[]>([]);
  const isManualTargetModeRef = useRef(false);
  const playbackAgentStateRef = useRef<Record<string, { opinion: number; sentiment: number; adoption: number }> | null>(null);
  const playbackTargetedRef = useRef<string[]>([]);
  const playbackColorModeRef = useRef<"cluster" | "opinion">("opinion");
  const exploreModeRef = useRef(exploreMode);
  const pathFromRef = useRef(pathFrom);
  const pathToRef = useRef(pathTo);
  hoveredRef.current = hoveredNodeId;
  selectedRef.current = selectedNodeId;
  highlightNodesRef.current = highlightedNodeIds;
  highlightEdgesRef.current = highlightedEdgeKeys;
  appliedTargetIdsRef.current = appliedTargetIds;
  isManualTargetModeRef.current = isManualTargetMode;
  playbackAgentStateRef.current = playbackAgentState;
  playbackTargetedRef.current = playbackTargetedIds;
  playbackColorModeRef.current = playbackColorMode;
  exploreModeRef.current = exploreMode;
  pathFromRef.current = pathFrom;
  pathToRef.current = pathTo;

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
        const agentState = playbackAgentStateRef.current;
        const targetedPlayback = playbackTargetedRef.current;
        const colorModePlayback = playbackColorModeRef.current;
        if (agentState && agentState[node]) {
          const state = agentState[node];
          const baseSize = (data.size as number) ?? 8;
          const adoptionSize = baseSize * (0.7 + 0.6 * state.adoption);
          let size = adoptionSize;
          if (state.adoption > 0.7) size *= 1.15;
          const targeted = targetedPlayback.includes(node);
          if (targeted) size *= 1.1;
          let color: string;
          if (colorModePlayback === "opinion") {
            color = getOpinionColor(state.opinion);
          } else {
            color = (data.color as string) ?? "#6366f1";
          }
          if (targeted) {
            color = color.startsWith("#") ? hexToRgba(color, 1) : color;
          }
          return {
            ...data,
            color,
            size: Math.max(2, size),
            label: data.label,
          };
        }
        const appliedTargets = appliedTargetIdsRef.current;
        if (appliedTargets.length > 0) {
          const targeted = appliedTargets.includes(node);
          if (targeted) {
            const c = data.color as string;
            const bright = c.startsWith("#") ? hexToRgba(c, 1) : c;
            return {
              ...data,
              color: bright,
              size: (data.size as number) * 1.25,
              label: data.label,
            };
          }
          const c = data.color as string;
          const dimColor = c.startsWith("#") ? hexToRgba(c, 0.25) : c.replace(")", ", 0.25)").replace("rgb", "rgba");
          return {
            ...data,
            color: dimColor,
            size: Math.max(2, (data.size as number) * 0.7),
            label: "",
          };
        }
        const highlightSet = highlightNodesRef.current;
        if (highlightSet.length > 0) {
          const inHighlight = highlightSet.includes(node);
          if (inHighlight) {
            return { ...data, size: (data.size as number) * 1.15, label: data.label };
          }
          const c = data.color as string;
          const dimColor = c.startsWith("#") ? hexToRgba(c, 0.2) : c.replace(")", ", 0.2)").replace("rgb", "rgba");
          return { ...data, color: dimColor, size: Math.max(2, (data.size as number) * 0.6), label: "" };
        }
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
        const edgeKeysSet = highlightEdgesRef.current;
        if (edgeKeysSet.length > 0) {
          const [source, target] = graph.extremities(edge);
          const key = edgeKey(source, target);
          const inHighlight = edgeKeysSet.includes(key);
          if (inHighlight) return { ...data, color: "rgba(255,255,255,0.7)" };
          return { ...data, color: "rgba(255,255,255,0.03)" };
        }
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
    sigma.on("clickNode", ({ node }) => {
      const id = node != null ? String(node) : null;
      if (!id) return;
      if (isManualTargetModeRef.current) {
        toggleManualTarget(id);
        return;
      }
      setSelectedNode(id);
      const mode = exploreModeRef.current;
      if (mode === "path") {
        if (!pathFromRef.current) setPathFrom(id);
        else if (!pathToRef.current) setPathTo(id);
        else {
          setPathFrom(id);
          setPathTo(null);
        }
      } else if (mode === "neighborhood") {
        setNeighborhoodCenter(id);
      }
    });
    sigma.on("clickStage", () => setSelectedNode(null));

    onSigmaReady(resetCamera);

    return () => {
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
      graphInstanceRef.current = null;
    };
  }, [nodes, edges]);

  const effectiveColorBy =
    playbackAgentState && playbackColorMode === "cluster" ? "cluster" : colorBy;

  useEffect(() => {
    const graph = graphInstanceRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;

    applyFilters(graph, filters, selectedTrait || traitKeys[0] || "");
    applyVisualAttributes(
      graph,
      effectiveColorBy,
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
  }, [effectiveColorBy, sizeBy, selectedTrait, traitKeys, filters, setVisibleNodeIds]);

  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    sigma.setSetting(
      "labelRenderedSizeThreshold",
      showLabels ? 0 : 999
    );
  }, [showLabels]);

  useEffect(() => {
    const sigma = sigmaRef.current;
    if (sigma) sigma.refresh();
  }, [highlightedNodeIds, highlightedEdgeKeys, appliedTargetIds, playbackAgentState, playbackTargetedIds, playbackColorMode]);

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

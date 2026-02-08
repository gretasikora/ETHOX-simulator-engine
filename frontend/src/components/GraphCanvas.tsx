import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import { random as randomLayout } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useGraphStore } from "../store/useGraphStore";
import { useUIStore } from "../store/useUIStore";
import { useExperimentStore } from "../store/useExperimentStore";
import { usePlaybackStore } from "../store/usePlaybackStore";
import { useSimulationStore } from "../store/useSimulationStore";
import {
  buildGraphology,
  applyFilters,
  applyVisualAttributes,
  type GraphUIState,
} from "../utils/graph";
import { hexToRgba, getOpinionColor, blendHex } from "../utils/color";
import { NodeSquareProgram, NodeTriangleProgram, NodeDiamondProgram } from "../sigma-shapes/NodeShapePrograms";
import { edgeKey } from "../utils/graphAlgorithms";
import { CareImpactOverlay } from "./CareImpactOverlay";
import { CareLegend } from "./CareLegend";

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
  const visibleNodeIds = useUIStore((s) => s.visibleNodeIds);
  const colorBy = useUIStore((s) => s.colorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const showLabels = useUIStore((s) => s.showLabels);
  const showAgeEncoding = useUIStore((s) => s.showAgeEncoding);
  const showGenderEncoding = useUIStore((s) => s.showGenderEncoding);
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

  const simulationNodeSizeOverride = useSimulationStore((s) => s.nodeSizeOverrideById);
  const simulationIsAnimating = useSimulationStore((s) => s.isAnimating);
  const careGlowById = useSimulationStore((s) => s.careGlowById);
  const careEdgeSweepIntensity = useSimulationStore((s) => s.careEdgeSweepIntensity);
  const careAnimationStatus = useSimulationStore((s) => s.careAnimationStatus);
  const animationProgress = useSimulationStore((s) => s.animationProgress);

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
  const simulationNodeSizeOverrideRef = useRef<Record<string, number>>({});
  const simulationIsAnimatingRef = useRef(false);
  const careGlowByIdRef = useRef<Record<string, { glowStrength: number; borderColor: string }>>({});
  const careEdgeSweepIntensityRef = useRef(0);
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
  simulationNodeSizeOverrideRef.current = simulationNodeSizeOverride;
  simulationIsAnimatingRef.current = simulationIsAnimating;
  careGlowByIdRef.current = careGlowById;
  careEdgeSweepIntensityRef.current = careEdgeSweepIntensity;
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
      showAgeEncoding,
      showGenderEncoding,
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
      labelWeight: string;
      labelRenderedSizeThreshold: number;
      nodeProgramClasses: Record<string, unknown>;
      nodeReducer: (node: string, data: Record<string, unknown>) => Record<string, unknown>;
      edgeReducer: (edge: string, data: Record<string, unknown>) => Record<string, unknown>;
    }> = {
      renderEdgeLabels: false,
      defaultEdgeType: "line",
      defaultNodeColor: "#2AFADF",
      defaultEdgeColor: "rgba(234,242,242,0.12)",
      minCameraRatio: 0.08,
      maxCameraRatio: 3,
      labelColor: { color: "rgba(234,242,242,0.65)" },
      labelFont: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      labelSize: 13,
      labelWeight: "600",
      labelRenderedSizeThreshold: showLabels ? 0 : 999,
      nodeProgramClasses: {
        square: NodeSquareProgram,
        triangle: NodeTriangleProgram,
        diamond: NodeDiamondProgram,
      },
      nodeReducer: (node, data) => {
        const attrs = graph.getNodeAttributes(node);
        if (attrs.hidden) return { ...data, hidden: true };
        const simOverride = simulationNodeSizeOverrideRef.current;
        const simAnimating = simulationIsAnimatingRef.current;
        const careGlow = careGlowByIdRef.current;
        if (simAnimating && simOverride && simOverride[node] != null) {
          let color = data.color as string;
          const glow = careGlow?.[node];
          if (glow && glow.glowStrength > 0 && glow.borderColor && glow.borderColor !== "transparent") {
            const accentColor = glow.borderColor === "#26C6FF" ? "#26C6FF" : "#64748B";
            color = blendHex(glow.glowStrength, color, accentColor);
          }
          return {
            ...data,
            size: simOverride[node],
            color,
            label: data.label,
          };
        }
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
          if (inHighlight) return { ...data, color: "rgba(38,198,255,0.55)" };
          const sweep = careEdgeSweepIntensityRef.current;
          const opacity = sweep > 0 ? 0.04 + 0.12 * sweep : 0.04;
          return { ...data, color: `rgba(234,242,242,${opacity})` };
        }
        const [source, target] = graph.extremities(edge);
        const focus = selectedRef.current || hoveredRef.current;
        const connected = focus && (source === focus || target === focus);
        if (connected) return { ...data, color: "rgba(38,198,255,0.55)" };
        if (focus) {
          const sweep = careEdgeSweepIntensityRef.current;
          const opacity = sweep > 0 ? 0.04 + 0.12 * sweep : 0.04;
          return { ...data, color: `rgba(234,242,242,${opacity})` };
        }
        const sweep = careEdgeSweepIntensityRef.current;
        const opacity = sweep > 0 ? Math.min(0.35, 0.12 + 0.2 * sweep) : 0.12;
        return { ...data, color: `rgba(234,242,242,${opacity})` };
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sigma = new Sigma(graph, containerRef.current, settings as any);
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
    playbackAgentState && playbackColorMode === "cluster" ? "age" : colorBy;

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
      [],
      showAgeEncoding,
      showGenderEncoding
    );
    sigma.refresh();
    const visibleIds: string[] = [];
    graph.forEachNode((node) => {
      if (!graph.getNodeAttribute(node, "hidden")) visibleIds.push(node);
    });
    setVisibleNodeIds(visibleIds);
  }, [effectiveColorBy, sizeBy, selectedTrait, traitKeys, filters, showAgeEncoding, showGenderEncoding, setVisibleNodeIds]);

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
  }, [highlightedNodeIds, highlightedEdgeKeys, appliedTargetIds, playbackAgentState, playbackTargetedIds, playbackColorMode, simulationNodeSizeOverride, simulationIsAnimating, careGlowById, careEdgeSweepIntensity]);

  // Do not animate camera on node select - it zoomed in too far (ratio 0.3) and
  // made the rest of the network disappear. The selected node is still highlighted
  // by the node reducer; the drawer shows details without changing the view.

  const showEmptyState = nodes.length > 0 && visibleNodeIds.length === 0;

  const [overlayFading, setOverlayFading] = useState(false);
  const overlayFadingRef = useRef(false);
  const prevAnimatingRef = useRef(false);
  useEffect(() => {
    const wasAnimating = prevAnimatingRef.current;
    prevAnimatingRef.current = simulationIsAnimating;
    if (wasAnimating && !simulationIsAnimating) {
      setOverlayFading(true);
      overlayFadingRef.current = true;
      const t = setTimeout(() => {
        setOverlayFading(false);
        overlayFadingRef.current = false;
      }, 250);
      return () => clearTimeout(t);
    }
  }, [simulationIsAnimating]);

  const showCareOverlay =
    careAnimationStatus === "animating" ||
    (simulationIsAnimating && animationProgress < 1) ||
    overlayFading;
  const showCareLegend = careAnimationStatus === "done" || (simulationIsAnimating && animationProgress > 0);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-aurora-border/40 bg-aurora-surface0/30 shadow-sm">
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            background: "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(10, 29, 36, 0.25) 0%, rgba(5, 11, 16, 0.5) 60%, rgba(5, 11, 16, 0.92) 100%)",
          }}
        />
        <CareImpactOverlay visible={showCareOverlay} fading={overlayFading} progress={animationProgress} />
        <CareLegend visible={showCareLegend} />
      </div>
      {showEmptyState && (
        <div className="absolute inset-0 flex items-center justify-center bg-aurora-bg0/90 backdrop-blur-[1px]">
          <div className="surface-elevated flex flex-col items-center gap-3 rounded-2xl px-8 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aurora-surface2 text-aurora-text2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-aurora-text0">No agents match your filters</p>
            <p className="text-xs text-aurora-text2">Adjust filters in the sidebar to see nodes</p>
          </div>
        </div>
      )}
    </div>
  );
}

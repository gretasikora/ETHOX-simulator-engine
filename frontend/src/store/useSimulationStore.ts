import { create } from "zustand";
import { runSimulation as runSimulationApi, fetchSimulationReport } from "../api/client";
import type { NodeData, EdgeData } from "../api/client";
import type { SimulationGraphData, SimulationNodeData, SimulationEdgeData } from "../api/client";
import { useGraphStore } from "./useGraphStore";
import { useUIStore } from "./useUIStore";
import { easeInOutCubic } from "../utils/easing";
import { computeCareSize, computeCareGlow } from "../utils/careSizing";

export type ReportStatus = "idle" | "loading" | "ready" | "error";

function normalizeNode(n: SimulationNodeData): NodeData {
  const node: NodeData = {
    agent_id: String(n.agent_id),
    degree: n.degree ?? 0,
    traits: n.traits ?? {},
    degree_centrality: n.degree_centrality ?? 0,
    betweenness_centrality: n.betweenness_centrality ?? 0,
  };
  if (n.age != null && typeof n.age === "number") node.age = n.age;
  if (n.gender != null && typeof n.gender === "string") node.gender = n.gender;
  if (n.level_of_care != null && typeof n.level_of_care === "number") node.level_of_care = n.level_of_care;
  if (n.effect_on_usage != null && typeof n.effect_on_usage === "number") node.effect_on_usage = n.effect_on_usage;
  if (n.text_opinion != null && typeof n.text_opinion === "string") node.text_opinion = n.text_opinion;
  const ext = n as { initial_opinion?: string; initial_level_of_care?: number; initial_effect_on_usage?: number };
  if (ext.initial_opinion != null && typeof ext.initial_opinion === "string") node.initial_opinion = ext.initial_opinion;
  if (ext.initial_level_of_care != null && typeof ext.initial_level_of_care === "number") node.initial_level_of_care = ext.initial_level_of_care;
  if (ext.initial_effect_on_usage != null && typeof ext.initial_effect_on_usage === "number") node.initial_effect_on_usage = ext.initial_effect_on_usage;
  return node;
}

function normalizeGraph(g: SimulationGraphData): { nodes: NodeData[]; edges: EdgeData[] } {
  return {
    nodes: g.nodes.map(normalizeNode),
    edges: g.edges.map((e: SimulationEdgeData) => ({
      source: String(e.source),
      target: String(e.target),
      weight: e.weight ?? 1,
    })),
  };
}

export type SimulationStatus =
  | "idle"
  | "loading_initial"
  | "initial_ready"
  | "animating"
  | "finished"
  | "error";
export type SimulationViewMode = "simulation" | "default";

export type CareAnimationStatus = "idle" | "animating" | "done";

export interface CareGlowData {
  glowStrength: number;
  borderColor: string;
}

export interface SimulationState {
  simulationInput: { trigger: string; numAgents: number };
  simulationId: string | null;
  initialGraph: { nodes: NodeData[]; edges: EdgeData[] } | null;
  finalGraph: { nodes: NodeData[]; edges: EdgeData[] } | null;
  status: SimulationStatus;
  viewMode: SimulationViewMode;
  error: string | null;
  animationProgress: number;
  isAnimating: boolean;
  careAnimationStatus: CareAnimationStatus;
  careEdgeSweepIntensity: number;
  nodeSizeOverrideById: Record<string, number>;
  careGlowById: Record<string, CareGlowData>;
  /** Report state */
  reportStatus: ReportStatus;
  reportCareScore100?: number;
  reportUsageEffect50?: number;
  reportText?: string;
  reportIncludeInitial: boolean;
  reportModalOpen: boolean;
  reportGeneratedAt?: string;
  setSimulationInput: (trigger: string, numAgents: number) => void;
  runSimulation: (trigger: string, numAgents: number) => Promise<void>;
  revertToDefault: () => Promise<void>;
  applySimulationGraph: () => void;
  startAnimation: () => void;
  finishAnimation: () => void;
  reset: () => void;
  /** Report actions */
  fetchReport: (simulationId: string, trigger: string, includeInitial: boolean) => Promise<void>;
  openReportModal: () => void;
  closeReportModal: () => void;
  setReportIncludeInitial: (v: boolean) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationInput: { trigger: "", numAgents: 100 },
  simulationId: null,
  initialGraph: null,
  finalGraph: null,
  status: "idle",
  viewMode: "default",
  error: null,
  animationProgress: 0,
  isAnimating: false,
  careAnimationStatus: "idle",
  careEdgeSweepIntensity: 0,
  nodeSizeOverrideById: {},
  careGlowById: {},
  reportStatus: "idle",
  reportIncludeInitial: false,
  reportModalOpen: false,

  setSimulationInput: (trigger: string, numAgents: number) => {
    set({ simulationInput: { trigger, numAgents } });
  },

  runSimulation: async (trigger: string, numAgents: number) => {
    set({ status: "loading_initial", error: null });
    try {
      const resp = await runSimulationApi(trigger, numAgents);
      const initial = normalizeGraph(resp.initial_graph);
      const final = normalizeGraph(resp.final_graph);

      set({
        simulationInput: { trigger, numAgents },
        simulationId: resp.simulation_id,
        initialGraph: initial,
        finalGraph: final,
        status: "initial_ready",
        viewMode: "simulation",
        error: null,
        animationProgress: 0,
        isAnimating: false,
        reportStatus: "idle",
        reportModalOpen: false,
      });

      useGraphStore.getState().setGraphData(initial.nodes, initial.edges);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Simulation failed";
      set({ status: "error", error: msg });
      throw e;
    }
  },

  startAnimation: () => {
    const { initialGraph, finalGraph } = get();
    if (!initialGraph || !finalGraph) return;

    set({
      status: "animating",
      isAnimating: true,
      animationProgress: 0,
      careAnimationStatus: "animating",
      careEdgeSweepIntensity: 0,
      nodeSizeOverrideById: {},
      careGlowById: {},
    });

    const baseSize = 8;
    const targetSizesByNode = new Map<string, number>();
    const glowByNode = new Map<string, { glowStrength: number; borderColor: string }>();
    for (const n of finalGraph.nodes) {
      const id = String(n.agent_id);
      const loc = n.level_of_care ?? 0.5;
      targetSizesByNode.set(id, computeCareSize(loc, baseSize));
      const glow = computeCareGlow(loc);
      glowByNode.set(id, { glowStrength: glow.glowStrength, borderColor: glow.borderColor });
    }
    // Nodes not in final graph: use base size and no glow
    for (const n of initialGraph.nodes) {
      const id = String(n.agent_id);
      if (!targetSizesByNode.has(id)) {
        targetSizesByNode.set(id, baseSize);
        glowByNode.set(id, { glowStrength: 0, borderColor: "transparent" });
      }
    }

    const start = performance.now();
    const ANIMATION_DURATION_MS = 1200;
    const EDGE_SWEEP_MS = 300;

    const tick = () => {
      const elapsed = performance.now() - start;
      const rawProgress = Math.min(1, elapsed / ANIMATION_DURATION_MS);
      const progress = easeInOutCubic(rawProgress);

      const nodeSizeOverrideById: Record<string, number> = {};
      const careGlowById: Record<string, { glowStrength: number; borderColor: string }> = {};
      targetSizesByNode.forEach((targetSize, id) => {
        const currentSize = baseSize + (targetSize - baseSize) * progress;
        nodeSizeOverrideById[id] = currentSize;
        const glow = glowByNode.get(id);
        if (glow && glow.glowStrength > 0) {
          careGlowById[id] = {
            glowStrength: glow.glowStrength * progress,
            borderColor: glow.borderColor,
          };
        }
      });

      let careEdgeSweepIntensity = 0;
      if (elapsed < EDGE_SWEEP_MS) {
        careEdgeSweepIntensity = easeInOutCubic(elapsed / EDGE_SWEEP_MS);
      } else {
        const sweepOut = elapsed - EDGE_SWEEP_MS;
        careEdgeSweepIntensity = Math.max(0, 1 - easeInOutCubic(sweepOut / EDGE_SWEEP_MS));
      }

      set({
        animationProgress: progress,
        nodeSizeOverrideById,
        careGlowById,
        careEdgeSweepIntensity,
      });

      if (rawProgress < 1) {
        requestAnimationFrame(tick);
      } else {
        get().finishAnimation();
      }
    };

    requestAnimationFrame(tick);
  },

  finishAnimation: () => {
    const { finalGraph } = get();
    if (finalGraph) {
      useGraphStore.getState().setGraphData(finalGraph.nodes, finalGraph.edges);
      useUIStore.getState().setSizeBy("level_of_care");
    }
    set({
      status: "finished",
      isAnimating: false,
      animationProgress: 1,
      careAnimationStatus: "done",
      careEdgeSweepIntensity: 0,
      nodeSizeOverrideById: {},
      careGlowById: {},
    });
  },

  revertToDefault: async () => {
    const { initialGraph } = get();
    if (initialGraph) {
      // Restore the original graph from before simulation effects (undo impacts of talking)
      useGraphStore.getState().setGraphData(initialGraph.nodes, initialGraph.edges);
      useUIStore.getState().setSizeBy("degree");
    } else {
      // No simulation run yet; load the default graph from the API
      await useGraphStore.getState().loadGraph();
    }
    set({ viewMode: "default" });
  },

  applySimulationGraph: () => {
    const { initialGraph } = get();
    if (!initialGraph) return;
    useGraphStore.getState().setGraphData(initialGraph.nodes, initialGraph.edges);
    set({ viewMode: "simulation" });
  },

  reset: () => {
    set({
      simulationId: null,
      initialGraph: null,
      finalGraph: null,
      status: "idle",
      viewMode: "default",
      error: null,
      animationProgress: 0,
      isAnimating: false,
      careAnimationStatus: "idle",
      careEdgeSweepIntensity: 0,
      nodeSizeOverrideById: {},
      careGlowById: {},
      reportStatus: "idle",
      reportCareScore100: undefined,
      reportUsageEffect50: undefined,
      reportText: undefined,
      reportGeneratedAt: undefined,
      reportModalOpen: false,
    });
  },

  fetchReport: async (simulationId: string, trigger: string, includeInitial: boolean) => {
    set({ reportStatus: "loading" });
    try {
      const resp = await fetchSimulationReport(simulationId, trigger, includeInitial);
      set({
        reportStatus: "ready",
        reportCareScore100: resp.care_score_100,
        reportUsageEffect50: resp.change_in_support_50,
        reportText: resp.report_text,
        reportIncludeInitial: includeInitial,
        reportGeneratedAt: new Date().toISOString(),
      });
    } catch {
      set({ reportStatus: "error" });
    }
  },

  openReportModal: () => set({ reportModalOpen: true }),
  closeReportModal: () => set({ reportModalOpen: false }),
  setReportIncludeInitial: (v) => set({ reportIncludeInitial: v }),
}));

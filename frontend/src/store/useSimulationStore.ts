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
/** Phases within a simulation run: pre_trigger (initial graph) → post_trigger (after Apply trigger) → animating → finished */
export type SimulationPhase = "pre_trigger" | "post_trigger" | "animating" | "finished";
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
  postTriggerGraph: { nodes: NodeData[]; edges: EdgeData[] } | null;
  finalGraph: { nodes: NodeData[]; edges: EdgeData[] } | null;
  status: SimulationStatus;
  phase: SimulationPhase;
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
  reportError: string | null;
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
  /** Show post-trigger graph (initial reactions). Call after Run, before Let them talk. */
  applyTrigger: () => void;
  /** Animate from post-trigger to final (let agents talk). */
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
  postTriggerGraph: null,
  finalGraph: null,
  status: "idle",
  phase: "pre_trigger",
  viewMode: "default",
  error: null,
  animationProgress: 0,
  isAnimating: false,
  careAnimationStatus: "idle",
  careEdgeSweepIntensity: 0,
  nodeSizeOverrideById: {},
  careGlowById: {},
  reportStatus: "idle",
  reportError: null,
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
      const postTrigger = normalizeGraph(resp.post_trigger_graph);
      const final = normalizeGraph(resp.final_graph);

      set({
        simulationInput: { trigger, numAgents },
        simulationId: resp.simulation_id,
        initialGraph: initial,
        postTriggerGraph: postTrigger,
        finalGraph: final,
        status: "initial_ready",
        phase: "pre_trigger",
        viewMode: "simulation",
        error: null,
        animationProgress: 0,
        isAnimating: false,
        careAnimationStatus: "idle",
        reportStatus: "idle",
        reportModalOpen: false,
      });

      useGraphStore.getState().setGraphData(initial.nodes, initial.edges);
      useUIStore.getState().setSizeBy("level_of_care");

      // Run through full flow: show initial briefly, then apply trigger, then animate to final
      const store = get();
      setTimeout(() => {
        store.applyTrigger();
        setTimeout(() => store.startAnimation(), 300);
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Simulation failed";
      set({ status: "error", error: msg });
      throw e;
    }
  },

  applyTrigger: () => {
    const { postTriggerGraph } = get();
    if (!postTriggerGraph) return;
    useGraphStore.getState().setGraphData(postTriggerGraph.nodes, postTriggerGraph.edges);
    useUIStore.getState().setSizeBy("level_of_care");
    set({ phase: "post_trigger" });
  },

  startAnimation: () => {
    const { postTriggerGraph, finalGraph } = get();
    if (!postTriggerGraph || !finalGraph) return;

    set({
      status: "animating",
      phase: "animating",
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
    for (const n of postTriggerGraph.nodes) {
      const id = String(n.agent_id);
      if (!targetSizesByNode.has(id)) {
        targetSizesByNode.set(id, baseSize);
        glowByNode.set(id, { glowStrength: 0, borderColor: "transparent" });
      }
    }

    const start = performance.now();
    const ANIMATION_DURATION_MS = 4000;  // Slower so the care impact is easier to follow
    const EDGE_SWEEP_MS = 1000;

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
      phase: "finished",
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
      useGraphStore.getState().setGraphData(initialGraph.nodes, initialGraph.edges);
      useUIStore.getState().setSizeBy("level_of_care");
    } else {
      await useGraphStore.getState().loadGraph();
    }
    set({ viewMode: "default", phase: "pre_trigger" });
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
      postTriggerGraph: null,
      finalGraph: null,
      status: "idle",
      phase: "pre_trigger",
      viewMode: "default",
      error: null,
      animationProgress: 0,
      isAnimating: false,
      careAnimationStatus: "idle",
      careEdgeSweepIntensity: 0,
      nodeSizeOverrideById: {},
      careGlowById: {},
      reportStatus: "idle",
      reportError: null,
      reportCareScore100: undefined,
      reportUsageEffect50: undefined,
      reportText: undefined,
      reportGeneratedAt: undefined,
      reportModalOpen: false,
    });
  },

  fetchReport: async (simulationId: string, trigger: string, includeInitial: boolean) => {
    set({ reportStatus: "loading", reportError: null });
    try {
      const resp = await fetchSimulationReport(simulationId, trigger, includeInitial);
      set({
        reportStatus: "ready",
        reportError: null,
        reportCareScore100: resp.care_score_100,
        reportUsageEffect50: resp.change_in_support_50,
        reportText: resp.report_text,
        reportIncludeInitial: includeInitial,
        reportGeneratedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not generate report.";
      set({ reportStatus: "error", reportError: message });
    }
  },

  openReportModal: () => set({ reportModalOpen: true, reportError: null }),
  closeReportModal: () => set({ reportModalOpen: false }),
  setReportIncludeInitial: (v) => set({ reportIncludeInitial: v }),
}));

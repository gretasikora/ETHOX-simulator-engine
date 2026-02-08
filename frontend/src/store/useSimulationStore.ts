import { create } from "zustand";
import { runSimulation as runSimulationApi } from "../api/client";
import type { NodeData, EdgeData } from "../api/client";
import type { SimulationGraphData, SimulationNodeData, SimulationEdgeData } from "../api/client";
import { useGraphStore } from "./useGraphStore";
import { useUIStore } from "./useUIStore";
import { easeInOutCubic } from "../utils/easing";
import { computeCareSize, computeCareGlow } from "../utils/careSizing";

function normalizeNode(n: SimulationNodeData): NodeData {
  return {
    ...n,
    agent_id: String(n.agent_id),
    degree: n.degree ?? 0,
    cluster: n.cluster ?? 0,
    traits: n.traits ?? {},
    degree_centrality: n.degree_centrality ?? 0,
    betweenness_centrality: n.betweenness_centrality ?? 0,
  };
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
  setSimulationInput: (trigger: string, numAgents: number) => void;
  runSimulation: (trigger: string, numAgents: number) => Promise<void>;
  revertToDefault: () => Promise<void>;
  applySimulationGraph: () => void;
  startAnimation: () => void;
  finishAnimation: () => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationInput: { trigger: "", numAgents: 100 },
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
        initialGraph: initial,
        finalGraph: final,
        status: "initial_ready",
        viewMode: "simulation",
        error: null,
        animationProgress: 0,
        isAnimating: false,
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
    set({ viewMode: "default" });
    await useGraphStore.getState().loadGraph();
  },

  applySimulationGraph: () => {
    const { initialGraph } = get();
    if (!initialGraph) return;
    useGraphStore.getState().setGraphData(initialGraph.nodes, initialGraph.edges);
    set({ viewMode: "simulation" });
  },

  reset: () => {
    set({
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
    });
  },
}));

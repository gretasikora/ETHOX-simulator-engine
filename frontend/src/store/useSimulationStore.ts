import { create } from "zustand";
import { runSimulation as runSimulationApi } from "../api/client";
import type { NodeData, EdgeData } from "../api/client";
import type { SimulationGraphData, SimulationNodeData, SimulationEdgeData } from "../api/client";
import { useGraphStore } from "./useGraphStore";

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

export type SimulationStatus = "idle" | "loading" | "ready";

export interface SimulationState {
  simulationInput: { trigger: string; numAgents: number };
  initialGraph: { nodes: NodeData[]; edges: EdgeData[] } | null;
  finalGraph: { nodes: NodeData[]; edges: EdgeData[] } | null;
  status: SimulationStatus;
  error: string | null;
  /** 0..1 progress of level_of_care transition animation */
  animationProgress: number;
  /** true while animation is running */
  isAnimating: boolean;
  runSimulation: (trigger: string, numAgents: number) => Promise<void>;
  startAnimation: () => void;
  /** Call when animation completes */
  finishAnimation: () => void;
  reset: () => void;
  /** Map agent_id -> size override during animation */
  nodeSizeOverrideById: Record<string, number>;
}

const ANIMATION_DURATION_MS = 1200;
const SIZE_K = 2; // multiplier for delta effect

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationInput: { trigger: "", numAgents: 100 },
  initialGraph: null,
  finalGraph: null,
  status: "idle",
  error: null,
  animationProgress: 0,
  isAnimating: false,
  nodeSizeOverrideById: {},

  runSimulation: async (trigger: string, numAgents: number) => {
    set({ status: "loading", error: null });
    try {
      const resp = await runSimulationApi(trigger, numAgents);
      const initial = normalizeGraph(resp.initial_graph);
      const final = normalizeGraph(resp.final_graph);

      set({
        simulationInput: { trigger, numAgents },
        initialGraph: initial,
        finalGraph: final,
        status: "ready",
        error: null,
        animationProgress: 0,
        isAnimating: false,
      });

      // Load initial graph into graph store
      useGraphStore.getState().setGraphData(initial.nodes, initial.edges);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Simulation failed";
      set({ status: "idle", error: msg });
      throw e;
    }
  },

  startAnimation: () => {
    const { initialGraph, finalGraph } = get();
    if (!initialGraph || !finalGraph) return;

    set({ isAnimating: true, animationProgress: 0 });

    const initialByNode = new Map<string, number>();
    const finalByNode = new Map<string, number>();
    for (const n of initialGraph.nodes) {
      initialByNode.set(n.agent_id, n.level_of_care ?? 0.5);
    }
    for (const n of finalGraph.nodes) {
      finalByNode.set(n.agent_id, n.level_of_care ?? 0.5);
    }

    const deltas = new Map<string, number>();
    const baseSize = 8;
    for (const n of initialGraph.nodes) {
      const id = n.agent_id;
      const initLoc = initialByNode.get(id) ?? 0.5;
      const finalLoc = finalByNode.get(id) ?? initLoc;
      deltas.set(id, finalLoc - initLoc);
    }
    for (const n of finalGraph.nodes) {
      const id = n.agent_id;
      if (!deltas.has(id)) {
        const finalLoc = finalByNode.get(id) ?? 0.5;
        deltas.set(id, finalLoc); // new node: grow in
      }
    }

    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const rawProgress = Math.min(1, elapsed / ANIMATION_DURATION_MS);
      const progress = easeInOutCubic(rawProgress);

      const nodeSizeOverrideById: Record<string, number> = {};
      deltas.forEach((delta, id) => {
        const deltaAnimated = delta * progress;
        const size = Math.max(2, Math.min(24, baseSize * (1 + SIZE_K * deltaAnimated)));
        nodeSizeOverrideById[id] = size;
      });

      set({ animationProgress: progress, nodeSizeOverrideById });

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
    }
    set({
      isAnimating: false,
      animationProgress: 1,
      nodeSizeOverrideById: {},
      status: "idle",
    });
  },

  reset: () => {
    set({
      initialGraph: null,
      finalGraph: null,
      status: "idle",
      error: null,
      animationProgress: 0,
      isAnimating: false,
      nodeSizeOverrideById: {},
    });
  },
}));

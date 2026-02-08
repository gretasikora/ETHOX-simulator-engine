import { create } from "zustand";
import {
  fetchGraph,
  type NodeData,
  type EdgeData,
  type GraphMetadata,
} from "../api/client";

interface GraphState {
  nodes: NodeData[];
  edges: EdgeData[];
  metadata: GraphMetadata | null;
  traitKeys: string[];
  loading: boolean;
  error: string | null;
  loadGraph: () => Promise<void>;
  setGraphData: (nodes: NodeData[], edges: EdgeData[]) => void;
  getNode: (id: string) => NodeData | undefined;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  metadata: null,
  traitKeys: [],
  loading: false,
  error: null,

  loadGraph: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchGraph();
      const traitKeys = data.metadata?.trait_keys ?? [];
      set({
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
        traitKeys,
        loading: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load graph";
      set({ loading: false, error: message });
    }
  },

  setGraphData: (nodes, edges) => {
    const traitKeysSet = new Set<string>();
    nodes.forEach((n) => {
      if (n.traits && typeof n.traits === "object") {
        Object.keys(n.traits).forEach((k) => traitKeysSet.add(k));
      }
    });
    const traitKeys = Array.from(traitKeysSet).sort();
    set({
      nodes,
      edges,
      metadata: {
        node_count: nodes.length,
        edge_count: edges.length,
        trait_keys: traitKeys,
      },
      traitKeys,
      loading: false,
      error: null,
    });
  },

  getNode: (id: string) => {
    return get().nodes.find((n) => String(n.agent_id) === String(id));
  },
}));

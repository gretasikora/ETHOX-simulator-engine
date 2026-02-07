import { create } from "zustand";
import {
  fetchGraph,
  type NodeData,
  type EdgeData,
  type GraphMetadata,
} from "../api/client";
import { CLUSTER_COLORS } from "../utils/color";

export interface ClusterInfo {
  id: number;
  count: number;
  color: string;
}

interface GraphState {
  nodes: NodeData[];
  edges: EdgeData[];
  metadata: GraphMetadata | null;
  traitKeys: string[];
  clusterList: ClusterInfo[];
  loading: boolean;
  error: string | null;
  loadGraph: () => Promise<void>;
  getNode: (id: string) => NodeData | undefined;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  metadata: null,
  traitKeys: [],
  clusterList: [],
  loading: false,
  error: null,

  loadGraph: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchGraph();
      const traitKeys = data.metadata?.trait_keys ?? [];
      const clusterList: ClusterInfo[] = Object.entries(data.metadata?.clusters ?? {}).map(
        ([id, count]) => ({
          id: parseInt(id, 10),
          count,
          color: CLUSTER_COLORS[parseInt(id, 10) % CLUSTER_COLORS.length],
        })
      );
      set({
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
        traitKeys,
        clusterList,
        loading: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load graph";
      set({ loading: false, error: message });
    }
  },

  getNode: (id: string) => {
    return get().nodes.find((n) => String(n.agent_id) === String(id));
  },
}));

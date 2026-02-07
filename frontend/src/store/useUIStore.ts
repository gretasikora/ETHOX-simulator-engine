import { create } from "zustand";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error";
}

interface UIState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  visibleNodeIds: string[];
  searchQuery: string;
  colorBy: "cluster" | "trait" | "centrality";
  sizeBy: "degree" | "centrality";
  selectedTrait: string;
  showLabels: boolean;
  filters: {
    clusters: number[];
    degreeRange: [number, number];
    traitRange: [number, number];
  };
  toasts: ToastItem[];
  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setVisibleNodeIds: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
  setColorBy: (v: "cluster" | "trait" | "centrality") => void;
  setSizeBy: (v: "degree" | "centrality") => void;
  setSelectedTrait: (trait: string) => void;
  toggleLabels: () => void;
  setClusterFilter: (clusters: number[]) => void;
  setDegreeRange: (range: [number, number]) => void;
  setTraitRange: (range: [number, number]) => void;
  resetFilters: () => void;
  addToast: (message: string, type: "success" | "error") => void;
  removeToast: (id: string) => void;
}

const defaultFilters = (): UIState["filters"] => ({
  clusters: [],
  degreeRange: [0, 999],
  traitRange: [0, 1],
});

export const useUIStore = create<UIState>((set, get) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  visibleNodeIds: [],
  searchQuery: "",
  colorBy: "cluster",
  sizeBy: "degree",
  selectedTrait: "",
  showLabels: true,
  filters: defaultFilters(),
  toasts: [],

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setVisibleNodeIds: (ids) => set({ visibleNodeIds: ids }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setColorBy: (v) => set({ colorBy: v }),
  setSizeBy: (v) => set({ sizeBy: v }),
  setSelectedTrait: (trait) => set({ selectedTrait: trait }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),

  setClusterFilter: (clusters) =>
    set((s) => ({ filters: { ...s.filters, clusters } })),
  setDegreeRange: (degreeRange) =>
    set((s) => ({ filters: { ...s.filters, degreeRange } })),
  setTraitRange: (traitRange) =>
    set((s) => ({ filters: { ...s.filters, traitRange } })),

  resetFilters: () => set({ filters: defaultFilters() }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

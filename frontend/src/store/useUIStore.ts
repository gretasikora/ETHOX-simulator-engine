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
  insightsPanelOpen: boolean;
  selectedClusterId: number | null;
  exploreMode: "none" | "path" | "neighborhood";
  pathFrom: string | null;
  pathTo: string | null;
  neighborhoodCenter: string | null;
  exploreHops: number;
  preferInfluence: boolean;
  highlightedNodeIds: string[];
  highlightedEdgeKeys: string[];
  exploreStatus: string;
  searchQuery: string;
  colorBy: "age" | "trait" | "centrality";
  sizeBy: "degree" | "centrality" | "level_of_care";
  selectedTrait: string;
  showLabels: boolean;
  showAgeEncoding: boolean;
  showGenderEncoding: boolean;
  graphViewMode: "2d" | "3d";
  filters: {
    clusters: number[];
    degreeRange: [number, number];
    traitRange: [number, number];
  };
  toasts: ToastItem[];
  societyViewOpen: boolean;
  /** Sidebar: when true, show thin icon rail only */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  /** Top menu/header: when true, show slim bar only; expand to show full controls */
  headerCollapsed: boolean;
  setHeaderCollapsed: (v: boolean) => void;
  /** Which filter sections are expanded (persisted when sidebar collapses) */
  filtersSectionOpen: { nodeEncoding: boolean; degreeRange: boolean; traitFilter: boolean };
  setFiltersSectionOpen: (key: keyof UIState["filtersSectionOpen"], value: boolean) => void;
  /** Minimal UI density (default ON) – lighter controls, progressive disclosure */
  minimalMode: boolean;
  setMinimalMode: (v: boolean) => void;
  setSocietyViewOpen: (open: boolean) => void;
  setShowAgeEncoding: (v: boolean) => void;
  setShowGenderEncoding: (v: boolean) => void;
  setGraphViewMode: (mode: "2d" | "3d") => void;
  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setVisibleNodeIds: (ids: string[]) => void;
  setInsightsPanelOpen: (open: boolean) => void;
  setSelectedClusterId: (id: number | null) => void;
  setExploreMode: (mode: "none" | "path" | "neighborhood") => void;
  setPathFrom: (id: string | null) => void;
  setPathTo: (id: string | null) => void;
  setNeighborhoodCenter: (id: string | null) => void;
  setExploreHops: (n: number) => void;
  setPreferInfluence: (v: boolean) => void;
  setHighlighted: (nodeIds: string[], edgeKeys: string[]) => void;
  clearHighlight: () => void;
  setExploreStatus: (msg: string) => void;
  setSearchQuery: (q: string) => void;
  setColorBy: (v: "age" | "trait" | "centrality") => void;
  setSizeBy: (v: "degree" | "centrality" | "level_of_care") => void;
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
  insightsPanelOpen: false,
  selectedClusterId: null,
  exploreMode: "none",
  pathFrom: null,
  pathTo: null,
  neighborhoodCenter: null,
  exploreHops: 2,
  preferInfluence: false,
  highlightedNodeIds: [],
  highlightedEdgeKeys: [],
  exploreStatus: "",
  searchQuery: "",
  colorBy: "centrality",
  sizeBy: "degree",
  selectedTrait: "",
  showLabels: true,
  showAgeEncoding: true,
  showGenderEncoding: true,
  graphViewMode: "2d",
  filters: defaultFilters(),
  toasts: [],
  societyViewOpen: false,
  sidebarCollapsed: false,
  headerCollapsed: false,
  filtersSectionOpen: { nodeEncoding: true, degreeRange: false, traitFilter: false },
  minimalMode: true,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setHeaderCollapsed: (v) => set({ headerCollapsed: v }),
  setFiltersSectionOpen: (key, value) =>
    set((s) => ({
      filtersSectionOpen: { ...s.filtersSectionOpen, [key]: value },
    })),
  setMinimalMode: (v) => set({ minimalMode: v }),
  setSocietyViewOpen: (open) => set({ societyViewOpen: open }),
  setShowAgeEncoding: (v) => set({ showAgeEncoding: v }),
  setShowGenderEncoding: (v) => set({ showGenderEncoding: v }),
  setGraphViewMode: (mode) => set({ graphViewMode: mode }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setVisibleNodeIds: (ids) => set({ visibleNodeIds: ids }),
  setInsightsPanelOpen: (open) => set({ insightsPanelOpen: open }),
  setSelectedClusterId: (id) => set({ selectedClusterId: id }),
  setExploreMode: (mode) => set({ exploreMode: mode }),
  setPathFrom: (id) => set({ pathFrom: id }),
  setPathTo: (id) => set({ pathTo: id }),
  setNeighborhoodCenter: (id) => set({ neighborhoodCenter: id }),
  setExploreHops: (n) => set({ exploreHops: Math.max(1, Math.min(3, n)) }),
  setPreferInfluence: (v) => set({ preferInfluence: v }),
  setHighlighted: (nodeIds, edgeKeys) =>
    set({ highlightedNodeIds: nodeIds, highlightedEdgeKeys: edgeKeys }),
  clearHighlight: () =>
    set({ highlightedNodeIds: [], highlightedEdgeKeys: [], exploreStatus: "" }),
  setExploreStatus: (msg) => set({ exploreStatus: msg }),
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

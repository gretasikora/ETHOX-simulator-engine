import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { SidebarFilters } from "./SidebarFilters";
import { GraphCanvas } from "./GraphCanvas";
import { Graph3D } from "./graph/Graph3D";
import { AgentProfileDrawer } from "./AgentProfileDrawer";
import { GraphExploreControls } from "./GraphExploreControls";
import { ToastContainer } from "./Toast";
import { ExperimentPanel } from "./experiments/ExperimentPanel";
import { SocietyPage } from "./society/SocietyPage";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { useSimulationStore } from "../store/useSimulationStore";
import { exportVisibleGraphToForceGraphData } from "../utils/graphExport";
import { ErrorBoundary } from "./ErrorBoundary";
import type Graph from "graphology";

export function AppShell() {
  const graphRef = useRef<Graph | null>(null);
  const [resetCameraFn, setResetCameraFn] = useState<(() => void) | null>(null);

  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const visibleNodeIds = useUIStore((s) => s.visibleNodeIds);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const societyViewOpen = useUIStore((s) => s.societyViewOpen);
  const graphViewMode = useUIStore((s) => s.graphViewMode);
  const filters = useUIStore((s) => s.filters);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const headerCollapsed = useUIStore((s) => s.headerCollapsed);
  const setHeaderCollapsed = useUIStore((s) => s.setHeaderCollapsed);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const showAgeEncoding = useUIStore((s) => s.showAgeEncoding);
  const showGenderEncoding = useUIStore((s) => s.showGenderEncoding);
  const colorBy = useUIStore((s) => s.colorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const traitKeys = useGraphStore((s) => s.traitKeys);
  const fgData = useMemo(() => {
    const { nodes: fgNodes, links: fgLinks, capped } = exportVisibleGraphToForceGraphData(
      nodes,
      edges,
      filters,
      selectedTrait || traitKeys[0] || ""
    );
    return { nodes: fgNodes, links: fgLinks, capped };
  }, [nodes, edges, filters, selectedTrait, traitKeys]);

  // Use full graph min/max (same as 2D) so 3D color gradient spans actual data range
  const centralityScale = useMemo(() => {
    if (nodes.length === 0) return { min: 0, max: 0.01 };
    const vals = nodes.map((n) => n.degree_centrality ?? 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { min, max: Math.max(min + 0.001, max) };
  }, [nodes]);
  const hoveredNodeId = useUIStore((s) => s.hoveredNodeId);

  const simulationStatus = useSimulationStore((s) => s.status);
  const startAnimation = useSimulationStore((s) => s.startAnimation);
  const isAnimating = useSimulationStore((s) => s.isAnimating);

  const open = selectedNodeId != null;

  useEffect(() => {
    if (simulationStatus === "ready") {
      startAnimation();
    }
  }, [simulationStatus, startAnimation]);

  useEffect(() => {
    if (selectedNodeId && visibleNodeIds.length > 0 && !visibleNodeIds.includes(selectedNodeId)) {
      setSelectedNode(null);
    }
  }, [selectedNodeId, visibleNodeIds, setSelectedNode]);

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setSelectedNode(null);
    },
    [setSelectedNode]
  );

  const handleResetCamera = useCallback(() => {
    resetCameraFn?.();
  }, [resetCameraFn]);

  const handleSearchSelect = useCallback((_agentId: string) => {
    // Selection is set in TopBar via store; GraphCanvas reacts to selectedNodeId
  }, []);

  return (
    <div
      className={`grid h-screen w-screen grid-cols-1 bg-aurora-bg0 ${sidebarCollapsed ? "lg:grid-cols-[52px_1fr]" : "lg:grid-cols-[260px_1fr]"}`}
    >
      <div className="h-0 w-0 overflow-visible lg:h-auto lg:w-auto lg:min-w-0">
        <SidebarFilters
          graphRef={graphRef}
          onResetCamera={handleResetCamera}
          onExportSubgraph={() => {}}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {headerCollapsed ? (
          <div className="sticky top-0 z-20 flex h-9 shrink-0 items-center justify-between border-b border-aurora-border/50 bg-aurora-bg1/90 px-3 backdrop-blur-sm">
            <span className="text-xs font-medium text-aurora-text1/90">Society Explorer</span>
            <button
              type="button"
              onClick={() => setHeaderCollapsed(false)}
              className="rounded p-1.5 text-aurora-text2 hover:bg-aurora-surface2/80 hover:text-aurora-text0"
              aria-label="Expand menu"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          </div>
        ) : (
          <AppHeader onSearchSelect={handleSearchSelect} />
        )}
        {societyViewOpen ? (
          <div className="relative flex-1 overflow-auto bg-aurora-bg0">
            <SocietyPage />
          </div>
        ) : (
          <div className="relative flex-1 min-h-0 p-5">
            <div className="h-full w-full min-h-0 relative">
              {graphViewMode === "2d" ? (
                <>
                  <GraphCanvas
                    graphRef={graphRef}
                    onSigmaReady={setResetCameraFn}
                  />
                  <GraphExploreControls />
                </>
              ) : (
                <>
                  {fgData.capped && (
                    <div className="absolute left-4 top-4 z-10 rounded-lg border border-aurora-accent1/50 bg-aurora-surface1/95 px-3 py-2 text-xs text-aurora-text0 backdrop-blur-sm">
                      3D view limited to 3000 nodes for performance.
                    </div>
                  )}
                  <Graph3D
                    nodes={fgData.nodes}
                    links={fgData.links}
                    selectedNodeId={selectedNodeId}
                    hoveredNodeId={hoveredNodeId}
                    onNodeClick={setSelectedNode}
                    onNodeHover={setHoveredNode}
                    showAgeEncoding={showAgeEncoding}
                    showGenderEncoding={showGenderEncoding}
                    colorBy={colorBy}
                    selectedTrait={selectedTrait || traitKeys[0] || ""}
                    centralityScale={centralityScale}
                    sizeBy={sizeBy}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <ErrorBoundary
        fallback={
          <div className="fixed right-4 top-4 z-50 rounded-lg border border-aurora-danger/50 bg-aurora-surface1 px-4 py-2 text-sm text-aurora-danger">
            Drawer failed to open. Close and try again.
          </div>
        }
      >
        <AgentProfileDrawer
          open={open}
          selectedNodeId={selectedNodeId}
          onOpenChange={handleDrawerOpenChange}
        />
      </ErrorBoundary>

      <ExperimentPanel />

      {isAnimating && (
        <div className="fixed right-4 top-16 z-40 flex flex-col gap-2">
          <div className="rounded-lg border border-aurora-accent1/50 bg-aurora-surface1/95 px-4 py-2.5 text-sm text-aurora-text0 backdrop-blur-sm shadow-aurora-glow-sm">
            Applying event impact…
          </div>
          <div className="rounded-lg border border-aurora-border/50 bg-aurora-surface1/90 px-3 py-2 text-xs text-aurora-text2">
            Bigger nodes = increased care, smaller = decreased care
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

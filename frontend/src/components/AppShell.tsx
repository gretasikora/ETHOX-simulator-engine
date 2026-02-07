import { useRef, useState, useCallback, useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { SidebarFilters } from "./SidebarFilters";
import { GraphCanvas } from "./GraphCanvas";
import { AgentProfileDrawer } from "./AgentProfileDrawer";
import { GraphExploreControls } from "./GraphExploreControls";
import { Legend } from "./Legend";
import { ToastContainer } from "./Toast";
import { ExperimentPanel } from "./experiments/ExperimentPanel";
import { SocietyPage } from "./society/SocietyPage";
import { useUIStore } from "../store/useUIStore";
import { ErrorBoundary } from "./ErrorBoundary";
import type Graph from "graphology";

export function AppShell() {
  const graphRef = useRef<Graph | null>(null);
  const [resetCameraFn, setResetCameraFn] = useState<(() => void) | null>(null);

  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const visibleNodeIds = useUIStore((s) => s.visibleNodeIds);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const societyViewOpen = useUIStore((s) => s.societyViewOpen);

  const open = selectedNodeId != null;

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
    <div className="grid h-screen w-screen grid-cols-1 bg-aurora-bg0 lg:grid-cols-[320px_1fr]">
      <div className="h-0 w-0 overflow-visible lg:h-auto lg:w-auto lg:min-w-0">
        <SidebarFilters
          graphRef={graphRef}
          onResetCamera={handleResetCamera}
          onExportSubgraph={() => {}}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onSearchSelect={handleSearchSelect} />
        {societyViewOpen ? (
          <div className="relative flex-1 overflow-auto bg-aurora-bg0">
            <SocietyPage />
          </div>
        ) : (
          <div className="relative flex-1 min-h-0 p-4">
            <div className="h-full w-full min-h-0 relative">
              <GraphCanvas
                graphRef={graphRef}
                onSigmaReady={setResetCameraFn}
              />
              <GraphExploreControls />
              <Legend />
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

      <ToastContainer />
    </div>
  );
}

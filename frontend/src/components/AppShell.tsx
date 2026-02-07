import { useRef, useState, useCallback, useEffect } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { TopBar } from "./TopBar";
import { GraphCanvas } from "./GraphCanvas";
import { AgentProfileDrawer } from "./AgentProfileDrawer";
import { Legend } from "./Legend";
import { ToastContainer } from "./Toast";
import { useUIStore } from "../store/useUIStore";
import { ErrorBoundary } from "./ErrorBoundary";
import type Graph from "graphology";

export function AppShell() {
  const graphRef = useRef<Graph | null>(null);
  const [resetCameraFn, setResetCameraFn] = useState<(() => void) | null>(null);

  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const visibleNodeIds = useUIStore((s) => s.visibleNodeIds);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

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
    <div className="flex h-screen w-screen bg-dark-900">
      <LeftSidebar
        graphRef={graphRef}
        onResetCamera={handleResetCamera}
        onExportSubgraph={() => {}}
      />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onSearchSelect={handleSearchSelect} />
        <div className="relative flex-1">
          <GraphCanvas
            graphRef={graphRef}
            onSigmaReady={setResetCameraFn}
          />
          <Legend />
        </div>
      </div>
      <ErrorBoundary
        fallback={
          <div className="fixed right-4 top-4 z-50 rounded border border-red-900/50 bg-dark-800 px-4 py-2 text-sm text-red-400">
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
      <ToastContainer />
    </div>
  );
}

import { useRef, useState, useCallback } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { TopBar } from "./TopBar";
import { GraphCanvas } from "./GraphCanvas";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import { Legend } from "./Legend";
import { ToastContainer } from "./Toast";
import type Graph from "graphology";

export function AppShell() {
  const graphRef = useRef<Graph | null>(null);
  const [resetCameraFn, setResetCameraFn] = useState<(() => void) | null>(null);

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
      <NodeDetailsPanel />
      <ToastContainer />
    </div>
  );
}

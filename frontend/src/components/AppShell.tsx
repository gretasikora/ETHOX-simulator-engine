import { useRef, useState, useCallback, useEffect } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { TopBar } from "./TopBar";
import { GraphCanvas } from "./GraphCanvas";
import { AgentProfileDrawer } from "./AgentProfileDrawer";
import { ClusterInsightsPanel } from "./ClusterInsightsPanel";
import { GraphExploreControls } from "./GraphExploreControls";
import { Legend } from "./Legend";
import { ToastContainer } from "./Toast";
import { ExperimentPanel } from "./experiments/ExperimentPanel";
import { PlaybackBar } from "./playback/PlaybackBar";
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
  const insightsPanelOpen = useUIStore((s) => s.insightsPanelOpen);
  const setInsightsPanelOpen = useUIStore((s) => s.setInsightsPanelOpen);
  const societyViewOpen = useUIStore((s) => s.societyViewOpen);

  const open = selectedNodeId != null;

  const handleSelectAgentFromInsights = useCallback(
    (agentId: string) => {
      setSelectedNode(agentId);
      setInsightsPanelOpen(false);
    },
    [setSelectedNode, setInsightsPanelOpen]
  );

  useEffect(() => {
    if (selectedNodeId && visibleNodeIds.length > 0 && !visibleNodeIds.includes(selectedNodeId)) {
      setSelectedNode(null);
    }
  }, [selectedNodeId, visibleNodeIds, setSelectedNode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInsightsPanelOpen(false);
    };
    if (insightsPanelOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [insightsPanelOpen, setInsightsPanelOpen]);

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
        {societyViewOpen ? (
          <div className="relative flex-1 overflow-hidden bg-dark-900">
            <SocietyPage />
          </div>
        ) : (
          <div className="relative flex-1 pb-16">
            <GraphCanvas
              graphRef={graphRef}
              onSigmaReady={setResetCameraFn}
            />
            <GraphExploreControls />
            <Legend />
          </div>
        )}
      </div>

      <PlaybackBar />
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

      {insightsPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50"
            aria-hidden
            onClick={() => setInsightsPanelOpen(false)}
          />
          <div
            className="fixed right-0 top-0 z-40 flex h-full w-[min(100%,32rem)] min-w-[400px] flex-col border-l border-dark-700 bg-dark-800 shadow-xl"
            role="dialog"
            aria-labelledby="insights-panel-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-dark-700 px-4 py-3">
              <h2 id="insights-panel-title" className="text-lg font-semibold text-white">
                Cluster Insights
              </h2>
              <button
                type="button"
                onClick={() => setInsightsPanelOpen(false)}
                className="rounded p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ClusterInsightsPanel onSelectAgent={handleSelectAgentFromInsights} />
            </div>
          </div>
        </>
      )}

      <ExperimentPanel />

      <ToastContainer />
    </div>
  );
}

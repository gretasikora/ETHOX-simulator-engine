import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useGraphStore } from "./store/useGraphStore";
import { useSimulationStore } from "./store/useSimulationStore";
import { useUIStore } from "./store/useUIStore";
import { AppShell } from "./components/AppShell";
import { RunSimulationPage } from "./pages/RunSimulationPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function ExplorerPage() {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const nodes = useGraphStore((s) => s.nodes);
  const loading = useGraphStore((s) => s.loading);
  const error = useGraphStore((s) => s.error);
  const addToast = useUIStore((s) => s.addToast);
  const simulationStatus = useSimulationStore((s) => s.status);
  const simulationInput = useSimulationStore((s) => s.simulationInput);
  const runSimulation = useSimulationStore((s) => s.runSimulation);
  const autoRunAttempted = useRef(false);

  useEffect(() => {
    if (nodes.length > 0) return;

    if (simulationInput.trigger && !autoRunAttempted.current) {
      autoRunAttempted.current = true;
      // Auto-run simulation so the graph is ready immediately
      runSimulation(simulationInput.trigger, simulationInput.numAgents);
    } else if (!simulationInput.trigger && simulationStatus !== "ready") {
      // No simulation input — load default graph (e.g. Skip to Explorer)
      loadGraph();
    }
  }, [nodes.length, simulationInput.trigger, simulationInput.numAgents, simulationStatus, runSimulation, loadGraph]);

  useEffect(() => {
    if (error) addToast(error, "error");
  }, [error, addToast]);

  if (nodes.length === 0 && simulationStatus !== "ready" && loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-aurora-bg0">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-aurora-accent1 border-t-transparent" />
          <p className="text-aurora-text1">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0 && simulationStatus !== "ready" && error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-aurora-bg0">
        <div className="surface-elevated max-w-md rounded-lg p-6 text-center">
          <p className="text-aurora-danger">{error}</p>
          <p className="mt-2 text-sm text-aurora-text2">
            Ensure the backend is running at http://127.0.0.1:8000, or run a simulation from /run
          </p>
          <button
            type="button"
            onClick={() => loadGraph()}
            className="aurora-gradient mt-4 rounded-lg px-4 py-2 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RunSimulationPage />} />
      <Route path="/run" element={<RunSimulationPage />} />
      <Route path="/explorer" element={<ExplorerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useEffect } from "react";
import { useGraphStore } from "./store/useGraphStore";
import { useUIStore } from "./store/useUIStore";
import { AppShell } from "./components/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const loading = useGraphStore((s) => s.loading);
  const error = useGraphStore((s) => s.error);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    if (error) addToast(error, "error");
  }, [error, addToast]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-aurora-bg0">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-aurora-accent1 border-t-transparent" />
          <p className="text-aurora-text1">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-aurora-bg0">
        <div className="surface-elevated max-w-md rounded-lg p-6 text-center">
          <p className="text-aurora-danger">{error}</p>
          <p className="mt-2 text-sm text-aurora-text2">
            Ensure the backend is running at http://127.0.0.1:8000
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

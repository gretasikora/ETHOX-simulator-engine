import { useEffect } from "react";
import { useGraphStore } from "./store/useGraphStore";
import { useUIStore } from "./store/useUIStore";
import { AppShell } from "./components/AppShell";

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
      <div className="flex h-screen w-screen items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-gray-400">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-900">
        <div className="max-w-md rounded-lg border border-dark-700 bg-dark-800 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-sm text-gray-500">
            Ensure the backend is running at http://127.0.0.1:8000
          </p>
          <button
            type="button"
            onClick={() => loadGraph()}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <AppShell />;
}

import { useState, useCallback } from "react";
import { useExperimentStore } from "../../store/useExperimentStore";
import { ExperimentBuilder } from "./ExperimentBuilder";
import { ExperimentList } from "./ExperimentList";

export function ExperimentPanel() {
  const [activeTab, setActiveTab] = useState<"builder" | "saved">("builder");
  const open = useExperimentStore((s) => s.experimentPanelOpen);
  const setExperimentPanelOpen = useExperimentStore((s) => s.setExperimentPanelOpen);

  const handleClose = useCallback(() => {
    setExperimentPanelOpen(false);
  }, [setExperimentPanelOpen]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/50 transition-opacity"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className="fixed right-0 top-0 z-40 flex h-full w-[min(100%,36rem)] min-w-[420px] flex-col border-l border-dark-700 bg-dark-800 shadow-xl"
        role="dialog"
        aria-labelledby="experiment-panel-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-dark-700 px-4 py-3">
          <h2 id="experiment-panel-title" className="text-lg font-semibold text-white">
            Experiment / Intervention
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex shrink-0 border-b border-dark-700">
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "builder"
                ? "border-b-2 border-accent text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "saved"
                ? "border-b-2 border-accent text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Saved
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {activeTab === "builder" && <ExperimentBuilder />}
          {activeTab === "saved" && <ExperimentList />}
        </div>
      </div>
    </>
  );
}

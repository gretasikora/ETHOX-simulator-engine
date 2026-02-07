import { useCallback } from "react";
import type { Experiment } from "../../types/experiment";
import { useExperimentStore } from "../../store/useExperimentStore";
import { useGraphStore } from "../../store/useGraphStore";
import { computeTargets } from "../../utils/experimentTargeting";

const TARGET_MODE_LABELS: Record<Experiment["targetMode"], string> = {
  all: "All agents",
  clusters: "By cluster(s)",
  top_influencers: "Top influencers",
  bridge_nodes: "Bridge nodes",
  manual: "Manual selection",
};

const TYPE_LABELS: Record<Experiment["interventionType"], string> = {
  message: "Message",
  feature: "Feature",
  pricing: "Pricing",
  announcement: "Announcement",
};

function downloadJson(filename: string, obj: object) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExperimentList() {
  const experiments = useExperimentStore((s) => s.experiments);
  const activeExperimentId = useExperimentStore((s) => s.activeExperimentId);
  const loadExperiment = useExperimentStore((s) => s.loadExperiment);
  const applyToGraph = useExperimentStore((s) => s.applyToGraph);
  const deleteExperiment = useExperimentStore((s) => s.deleteExperiment);
  const setManualTargetIds = useExperimentStore((s) => s.setManualTargetIds);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const handleLoad = useCallback(
    (id: string) => {
      const exp = loadExperiment(id);
      if (exp?.targetMode === "manual" && exp.targetParams?.manualIds?.length) {
        setManualTargetIds(exp.targetParams.manualIds);
      }
    },
    [loadExperiment, setManualTargetIds]
  );

  const handleApply = useCallback(
    (id: string) => {
      applyToGraph(id, nodes, edges);
    },
    [applyToGraph, nodes, edges]
  );

  const handleExport = useCallback((exp: Experiment) => {
    downloadJson(`experiment-${exp.name.replace(/\s+/g, "-")}.json`, exp);
  }, []);

  if (experiments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p className="text-sm">No saved experiments yet.</p>
        <p className="mt-1 text-xs">Use the Builder tab to create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {experiments.map((exp) => {
        const targetCount =
          exp.computedTargets?.length ??
          computeTargets(exp, nodes, edges).length;
        const isActive = exp.id === activeExperimentId;

        return (
          <div
            key={exp.id}
            className={`rounded-lg border p-4 ${
              isActive
                ? "border-accent bg-accent/10"
                : "border-dark-700 bg-dark-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{exp.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded bg-dark-700 px-1.5 py-0.5 text-xs text-gray-300">
                    {TYPE_LABELS[exp.interventionType]}
                  </span>
                  <span className="rounded bg-dark-700 px-1.5 py-0.5 text-xs text-gray-400">
                    {TARGET_MODE_LABELS[exp.targetMode]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {targetCount} targets · {Math.round((exp.intensity ?? 0.5) * 100)}% intensity
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLoad(exp.id)}
                className="rounded border border-dark-600 px-2 py-1 text-xs text-gray-300 hover:bg-dark-700"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => handleApply(exp.id)}
                className="rounded bg-accent/20 px-2 py-1 text-xs text-accent hover:bg-accent/30"
              >
                Apply to graph
              </button>
              <button
                type="button"
                onClick={() => handleExport(exp)}
                className="rounded border border-dark-600 px-2 py-1 text-xs text-gray-300 hover:bg-dark-700"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => deleteExperiment(exp.id)}
                className="rounded border border-red-900/50 px-2 py-1 text-xs text-red-400 hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

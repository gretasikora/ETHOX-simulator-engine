import { useCallback, useEffect } from "react";
import type { Experiment, InterventionType } from "../../types/experiment";
import { useExperimentStore } from "../../store/useExperimentStore";
import { useGraphStore } from "../../store/useGraphStore";
import { useUIStore } from "../../store/useUIStore";
import { TargetModeControls } from "./TargetModeControls";

const INTERVENTION_TYPES: {
  value: InterventionType;
  label: string;
  oneLiner: string;
}[] = [
  { value: "message", label: "Message", oneLiner: "Send a message or notification to targets." },
  { value: "feature", label: "Feature", oneLiner: "Roll out a feature to selected agents." },
  { value: "pricing", label: "Pricing", oneLiner: "Apply a pricing change or offer." },
  { value: "announcement", label: "Announcement", oneLiner: "Broadcast an announcement to targets." },
];

export function ExperimentBuilder() {
  const experiments = useExperimentStore((s) => s.experiments);
  const activeExperimentId = useExperimentStore((s) => s.activeExperimentId);
  const appliedTargetIds = useExperimentStore((s) => s.appliedTargetIds);
  const manualTargetIds = useExperimentStore((s) => s.manualTargetIds);
  const updateExperiment = useExperimentStore((s) => s.updateExperiment);
  const applyToGraph = useExperimentStore((s) => s.applyToGraph);
  const clearFromGraph = useExperimentStore((s) => s.clearFromGraph);
  const setManualTargetIds = useExperimentStore((s) => s.setManualTargetIds);
  const toggleManualTarget = useExperimentStore((s) => s.toggleManualTarget);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const clusterList = useGraphStore((s) => s.clusterList);

  const experiment = activeExperimentId
    ? experiments.find((e) => e.id === activeExperimentId)
    : null;

  const isApplied =
    activeExperimentId === experiment?.id && appliedTargetIds.length > 0;

  const handleApply = useCallback(() => {
    if (!activeExperimentId) return;
    applyToGraph(activeExperimentId, nodes, edges);
  }, [activeExperimentId, applyToGraph, nodes, edges]);

  const handleClear = useCallback(() => {
    clearFromGraph();
  }, [clearFromGraph]);

  const handleSelectAgent = useCallback(
    (id: string) => {
      setSelectedNode(id);
    },
    [setSelectedNode]
  );

  if (!experiment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-aurora-text2">
        <p className="text-sm">No experiment selected.</p>
        <p className="mt-1 text-xs">Create one from the Saved tab or close and click &quot;New Experiment&quot;.</p>
      </div>
    );
  }

  const setExperiment = (patch: Partial<Experiment>) =>
    updateExperiment(experiment.id, patch);

  // Persist manual selection to experiment when in manual mode
  useEffect(() => {
    if (experiment.targetMode !== "manual") return;
    const current = JSON.stringify(experiment.targetParams?.manualIds ?? []);
    const next = JSON.stringify(manualTargetIds);
    if (current !== next) {
      updateExperiment(experiment.id, {
        targetParams: { ...experiment.targetParams, manualIds: [...manualTargetIds] },
      });
    }
  }, [manualTargetIds, experiment.id, experiment.targetMode, experiment.targetParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-aurora-text0">Experiment Builder</h2>
        <input
          type="text"
          value={experiment.name}
          onChange={(e) => setExperiment({ name: e.target.value })}
          placeholder="Experiment name"
          className="w-full rounded border border-aurora-border bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:ring-1 focus:ring-aurora-accent1 focus:outline-none"
        />
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            isApplied ? "bg-aurora-success/20 text-aurora-success" : "bg-aurora-surface2 text-aurora-text2"
          }`}
        >
          {isApplied ? "Applied" : "Not applied"}
        </span>
      </div>

      {/* Intervention type */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-aurora-text2">
          Intervention type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {INTERVENTION_TYPES.map(({ value, label, oneLiner }) => (
            <button
              key={value}
              type="button"
              onClick={() => setExperiment({ interventionType: value })}
              className={`rounded-lg border p-3 text-left ${
                experiment.interventionType === value
                  ? "border-aurora-accent1 bg-aurora-accent1/10"
                  : "border-aurora-border bg-aurora-surface1 hover:border-aurora-border-strong"
              }`}
            >
              <span className="block font-medium text-aurora-text0">{label}</span>
              <span className="mt-0.5 block text-xs text-aurora-text2">{oneLiner}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-aurora-text2">
          Content
        </label>
        {(experiment.interventionType === "message" ||
          experiment.interventionType === "announcement") && (
          <textarea
            value={experiment.content?.text ?? ""}
            onChange={(e) =>
              setExperiment({ content: { ...experiment.content, text: e.target.value } })
            }
            placeholder="Copy / Message"
            rows={3}
            className="w-full rounded border border-aurora-border bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:ring-1 focus:ring-aurora-accent1 focus:outline-none"
          />
        )}
        {experiment.interventionType === "feature" && (
          <input
            type="text"
            value={experiment.content?.featureName ?? ""}
            onChange={(e) =>
              setExperiment({ content: { ...experiment.content, featureName: e.target.value } })
            }
            placeholder="Feature name"
            className="w-full rounded border border-aurora-border bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:ring-1 focus:ring-aurora-accent1 focus:outline-none"
          />
        )}
        {experiment.interventionType === "pricing" && (
          <input
            type="text"
            value={experiment.content?.pricingNote ?? ""}
            onChange={(e) =>
              setExperiment({ content: { ...experiment.content, pricingNote: e.target.value } })
            }
            placeholder="Price change summary"
            className="w-full rounded border border-aurora-border bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:ring-1 focus:ring-aurora-accent1 focus:outline-none"
          />
        )}
      </div>

      {/* Targeting */}
      <TargetModeControls
        experiment={experiment}
        nodes={nodes}
        edges={edges}
        clusterList={clusterList}
        onExperimentUpdate={(patch) => updateExperiment(experiment.id, patch)}
        manualTargetIds={manualTargetIds}
        onClearManual={() => setManualTargetIds([])}
        onToggleManual={toggleManualTarget}
        onSelectAgent={handleSelectAgent}
      />

      {/* Intensity */}
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-aurora-text2">
          Intensity: {Math.round((experiment.intensity ?? 0) * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={experiment.intensity ?? 0.5}
          onChange={(e) => setExperiment({ intensity: Number(e.target.value) })}
          className="w-full [accent-color:var(--accent-1)]"
        />
        <p className="text-xs text-aurora-text2">
          Controls how strongly the intervention affects targeted agents (simulation coming soon).
        </p>
      </div>

      {/* Apply / Clear */}
      <div className="flex gap-2 border-t border-aurora-border pt-4">
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-aurora-text0 hover:bg-accent-light"
        >
          Apply to graph
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-aurora-border py-2 px-4 text-sm text-aurora-text1 hover:bg-aurora-surface2"
        >
          Clear from graph
        </button>
      </div>
    </div>
  );
}

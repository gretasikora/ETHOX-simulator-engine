import { useMemo } from "react";
import type { Experiment, ExperimentTargetParams } from "../../types/experiment";
import type { NodeData } from "../../api/client";
import { computeTargets } from "../../utils/experimentTargeting";

interface TargetModeControlsProps {
  experiment: Experiment;
  nodes: NodeData[];
  edges: { source: string; target: string; weight: number }[];
  onExperimentUpdate: (patch: Partial<Experiment>) => void;
  manualTargetIds: string[];
  onClearManual: () => void;
  onToggleManual?: (id: string) => void;
  onSelectAgent?: (id: string) => void;
}

const TARGET_MODES: { value: Experiment["targetMode"]; label: string }[] = [
  { value: "all", label: "All agents" },
  { value: "top_influencers", label: "Top influencers" },
  { value: "bridge_nodes", label: "Bridge nodes" },
  { value: "manual", label: "Manual selection" },
];

export function TargetModeControls({
  experiment,
  nodes,
  edges,
  onExperimentUpdate,
  manualTargetIds,
  onClearManual,
  onToggleManual,
  onSelectAgent,
}: TargetModeControlsProps) {
  const params = experiment.targetParams ?? {};
  const targetMode = experiment.targetMode;

  const previewTargets = useMemo(() => {
    const expWithManual =
      targetMode === "manual"
        ? { ...experiment, targetParams: { ...params, manualIds: manualTargetIds } }
        : experiment;
    return computeTargets(expWithManual, nodes, edges);
  }, [experiment, targetMode, params, manualTargetIds, nodes, edges]);

  const topInfluencerPreview = useMemo(() => {
    if (targetMode !== "top_influencers") return [];
    const metric = params.metric ?? "social_influence";
    const topN = Math.max(1, Math.min(50, params.topN ?? 10));
    const score = (n: NodeData) => {
      if (metric === "betweenness_centrality") return n.betweenness_centrality ?? 0;
      if (metric === "degree_centrality") return n.degree_centrality ?? 0;
      const v = (n.traits ?? {}).social_influence;
      return typeof v === "number" ? v : n.degree_centrality ?? 0;
    };
    return [...nodes]
      .sort((a, b) => score(b) - score(a))
      .slice(0, topN)
      .map((n) => String(n.agent_id));
  }, [targetMode, params.metric, params.topN, nodes]);

  const topBridgePreview = useMemo(() => {
    if (targetMode !== "bridge_nodes") return [];
    const topN = Math.max(1, Math.min(50, params.topN ?? 10));
    return [...nodes]
      .sort((a, b) => (b.betweenness_centrality ?? 0) - (a.betweenness_centrality ?? 0))
      .slice(0, topN)
      .map((n) => String(n.agent_id));
  }, [targetMode, params.topN, nodes]);

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-wider text-aurora-text2">
        Target audience
      </label>
      <div className="flex flex-wrap gap-2">
        {TARGET_MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onExperimentUpdate({ targetMode: value })}
            className={`rounded-lg border px-3 py-2 text-sm ${
              targetMode === value
                ? "border-accent bg-accent/20 text-white"
                : "border-aurora-border bg-aurora-surface1 text-aurora-text2 hover:border-aurora-border-strong hover:text-aurora-text0"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mode-specific controls */}
      {targetMode === "all" && (
        <p className="text-sm text-aurora-text2">Targets: {nodes.length} agents</p>
      )}

      {targetMode === "top_influencers" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-aurora-text2">Metric</label>
            <select
              value={params.metric ?? "social_influence"}
              onChange={(e) =>
                onExperimentUpdate({
                  targetParams: {
                    ...params,
                    metric: e.target.value as ExperimentTargetParams["metric"],
                  },
                })
              }
              className="mt-1 w-full rounded border border-aurora-border bg-aurora-surface1 px-2 py-1.5 text-sm text-aurora-text0"
            >
              <option value="social_influence">Social influence (trait)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-aurora-text2">Top N (1–50)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={params.topN ?? 10}
              onChange={(e) =>
                onExperimentUpdate({
                  targetParams: {
                    ...params,
                    topN: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                  },
                })
              }
              className="mt-1 w-full rounded border border-aurora-border bg-aurora-surface1 px-2 py-1.5 text-sm text-aurora-text0"
            />
          </div>
          <p className="text-xs text-aurora-text2">
            Preview: {topInfluencerPreview.slice(0, 5).join(", ")}
            {topInfluencerPreview.length > 5 ? "…" : ""}
          </p>
        </div>
      )}

      {targetMode === "bridge_nodes" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-aurora-text2">Top N (1–50)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={params.topN ?? 10}
              onChange={(e) =>
                onExperimentUpdate({
                  targetParams: {
                    ...params,
                    topN: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                  },
                })
              }
              className="mt-1 w-full rounded border border-aurora-border bg-aurora-surface1 px-2 py-1.5 text-sm text-aurora-text0"
            />
          </div>
          <p className="text-xs text-aurora-text2">
            Preview: {topBridgePreview.slice(0, 5).join(", ")}
            {topBridgePreview.length > 5 ? "…" : ""}
          </p>
        </div>
      )}

      {targetMode === "manual" && (
        <div className="space-y-2">
          <p className="text-sm text-aurora-text2">
            Click nodes in the graph to add or remove them from the target list.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClearManual}
              className="rounded border border-aurora-border px-2 py-1 text-xs text-aurora-text2 hover:bg-aurora-surface2"
            >
              Clear selection
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto rounded border border-aurora-border p-2">
            {manualTargetIds.length === 0 ? (
              <p className="text-xs text-aurora-text2">No agents selected</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {manualTargetIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded bg-aurora-surface2 px-2 py-0.5 text-xs"
                  >
                    {id}
                    {onToggleManual && (
                      <button
                        type="button"
                        onClick={() => onToggleManual(id)}
                        className="text-aurora-text2 hover:text-aurora-danger"
                        title="Remove from selection"
                      >
                        ×
                      </button>
                    )}
                    {onSelectAgent && (
                      <button
                        type="button"
                        onClick={() => onSelectAgent(id)}
                        className="text-aurora-text2 hover:text-aurora-text0"
                        title="View profile"
                      >
                        ↗
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-aurora-text2">Targets: {manualTargetIds.length} agents</p>
        </div>
      )}

      {targetMode !== "all" && targetMode !== "manual" && (
        <p className="text-sm text-aurora-text2">Targets: {previewTargets.length} agents</p>
      )}
    </div>
  );
}

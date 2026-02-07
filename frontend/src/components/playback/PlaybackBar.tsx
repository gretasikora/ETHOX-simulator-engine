import { useCallback } from "react";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import { useGraphStore } from "../../store/useGraphStore";
import { useExperimentStore } from "../../store/useExperimentStore";
import { generateDemoRun } from "../../utils/generateDemoRun";
import { PlaybackControls } from "./PlaybackControls";
import { RunSelector } from "./RunSelector";
import { PlaybackLegend } from "./PlaybackLegend";

export function PlaybackBar() {
  const runs = usePlaybackStore((s) => s.runs);
  const activeRunId = usePlaybackStore((s) => s.activeRunId);
  const colorMode = usePlaybackStore((s) => s.colorMode);
  const setActiveRunId = usePlaybackStore((s) => s.setActiveRunId);
  const setColorMode = usePlaybackStore((s) => s.setColorMode);
  const addRun = usePlaybackStore((s) => s.addRun);
  const clearRuns = usePlaybackStore((s) => s.clearRuns);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const appliedTargetIds = useExperimentStore((s) => s.appliedTargetIds);

  const handleGenerateDemo = useCallback(() => {
    if (nodes.length === 0) return;
    const run = generateDemoRun({
      nodes,
      edges,
      timesteps: 30,
      targetedAgentIds: appliedTargetIds.length > 0 ? appliedTargetIds : undefined,
      seed: Math.floor(Math.random() * 1e6),
      name: `Demo ${runs.length + 1}`,
    });
    addRun(run);
  }, [nodes, edges, appliedTargetIds, runs.length, addRun]);

  const activeRun = activeRunId ? runs.find((r) => r.id === activeRunId) : null;
  const agentCount = activeRun?.frames[0]
    ? Object.keys(activeRun.frames[0].agents).length
    : 0;
  const frameCount = activeRun?.frames.length ?? 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-4 border-t border-dark-700 bg-dark-800 px-4 py-3 shadow-lg">
      <div className="flex items-center gap-4">
        <RunSelector
          runs={runs}
          activeRunId={activeRunId}
          onSelect={setActiveRunId}
        />
        <PlaybackControls />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded border border-dark-600 px-2 py-1">
          <span className="text-xs text-gray-500">Color by</span>
          <div className="flex rounded p-0.5">
            {(["cluster", "opinion"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setColorMode(mode)}
                className={`rounded px-2 py-0.5 text-xs capitalize ${
                  colorMode === mode
                    ? "bg-amber-500/30 text-amber-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded bg-dark-700 px-2 py-0.5">
            Agents: {agentCount || "—"}
          </span>
          <span className="rounded bg-dark-700 px-2 py-0.5">
            Frames: {frameCount || "—"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGenerateDemo}
          disabled={nodes.length === 0}
          className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-40"
        >
          Generate demo run
        </button>
        <button
          type="button"
          onClick={clearRuns}
          className="rounded-lg border border-dark-600 px-3 py-2 text-sm text-gray-400 hover:bg-dark-700 hover:text-gray-200"
        >
          Clear run
        </button>
      </div>

      <div className="w-48 shrink-0">
        <PlaybackLegend />
      </div>
    </div>
  );
}

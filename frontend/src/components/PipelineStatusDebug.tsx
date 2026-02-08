/**
 * Optional debug panel for pipeline status. Renders only in dev mode.
 * Shows: current phase, node/edge counts, whether final graph has level_of_care.
 */
import { useSimulationStore } from "../store/useSimulationStore";
import { useGraphStore } from "../store/useGraphStore";

export function PipelineStatusDebug() {
  if (import.meta.env.PROD) return null;

  const status = useSimulationStore((s) => s.status);
  const initialGraph = useSimulationStore((s) => s.initialGraph);
  const finalGraph = useSimulationStore((s) => s.finalGraph);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const finalHasLevelOfCare =
    finalGraph?.nodes?.every((n) => n.level_of_care != null) ?? false;
  const initialHasLevelOfCare =
    initialGraph?.nodes?.some((n) => n.level_of_care != null) ?? false;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 rounded-lg border border-aurora-border/50 bg-aurora-surface1/95 px-3 py-2 text-xs text-aurora-text0 backdrop-blur-sm"
      aria-hidden
    >
      <div className="font-medium text-aurora-text1">Pipeline status</div>
      <div className="mt-1 space-y-0.5">
        <div>Phase: {status}</div>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        <div>Initial has care: {initialHasLevelOfCare ? "yes" : "no"}</div>
        <div>Final has level_of_care: {finalHasLevelOfCare ? "yes" : "no"}</div>
      </div>
    </div>
  );
}

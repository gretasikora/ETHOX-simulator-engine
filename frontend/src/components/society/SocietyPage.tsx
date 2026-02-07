import { useMemo, useCallback, useState } from "react";
import { useGraphStore } from "../../store/useGraphStore";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import {
  computeStructuralMetrics,
  computeLiveMetrics,
  computeClusterBreakdown,
} from "../../utils/metrics";
import { generateInsights } from "../../utils/insightRules";
import { MetricCards } from "./MetricCards";
import { ClusterBreakdownTable } from "./ClusterBreakdownTable";
import { InsightsFeed } from "./InsightsFeed";

export function SocietyPage() {
  const [recomputeKey, setRecomputeKey] = useState(0);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const playbackRunId = usePlaybackStore((s) => s.activeRunId);
  const playbackT = usePlaybackStore((s) => s.t);
  const playbackRuns = usePlaybackStore((s) => s.runs);

  const structural = useMemo(() => {
    if (nodes.length === 0) return null;
    return computeStructuralMetrics(nodes, edges);
  }, [nodes, edges]);

  const currentAgents = useMemo(() => {
    const run = playbackRunId ? playbackRuns.find((r) => r.id === playbackRunId) : null;
    if (!run?.frames?.length) return null;
    const frame = run.frames[Math.min(playbackT, run.frames.length - 1)];
    return frame?.agents ?? null;
  }, [playbackRunId, playbackT, playbackRuns]);

  const liveDay0Agents = useMemo(() => {
    const run = playbackRunId ? playbackRuns.find((r) => r.id === playbackRunId) : null;
    if (!run?.frames?.length) return null;
    return run.frames[0]?.agents ?? null;
  }, [playbackRunId, playbackRuns]);

  const live = useMemo(() => {
    if (!currentAgents || nodes.length === 0) return null;
    return computeLiveMetrics(nodes, currentAgents);
  }, [nodes, currentAgents]);

  const liveDay0 = useMemo(() => {
    if (!liveDay0Agents || nodes.length === 0) return null;
    return computeLiveMetrics(nodes, liveDay0Agents);
  }, [nodes, liveDay0Agents]);

  const insights = useMemo(() => {
    if (!structural) return [];
    return generateInsights(structural, live, liveDay0 ?? null);
  }, [structural, live, liveDay0, recomputeKey]);

  const clusterRows = useMemo(() => {
    if (nodes.length === 0) return [];
    return computeClusterBreakdown(nodes, edges, currentAgents ?? undefined);
  }, [nodes, edges, currentAgents]);

  const recompute = useCallback(() => {
    setRecomputeKey((k) => k + 1);
  }, []);

  if (!structural) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-aurora-text2">
        <p className="text-sm">Load a graph to see society metrics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-semibold text-aurora-text0">Society Health</h1>
        <p className="text-sm text-aurora-text2">Structural and playback-aware metrics</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-aurora-text2">
          Metrics
        </h2>
        <MetricCards
          structural={structural}
          live={live}
          liveDay0={liveDay0}
          currentDay={playbackT}
        />
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-aurora-text2">
            Insights Feed
          </h2>
          <InsightsFeed insights={insights} onRecompute={recompute} />
        </section>
        <section className="flex min-h-0 flex-col">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-aurora-text2">
            Breakdown
          </h2>
          <ClusterBreakdownTable rows={clusterRows} hasLive={live != null} />
        </section>
      </div>
    </div>
  );
}

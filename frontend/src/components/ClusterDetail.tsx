import { useState, useMemo } from "react";
import type { ClusterStats } from "../utils/clusterStats";
import { formatNumber } from "../utils/clusterStats";
import { formatTraitLabel } from "../utils/traits";
import { getClusterColor } from "../utils/color";
import type { NodeData } from "../api/client";

interface ClusterDetailProps {
  stats: ClusterStats | null;
  onSelectAgent: (agentId: string) => void;
}

function TraitBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{formatTraitLabel(label)}</span>
        <span className="tabular-nums text-gray-200">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-dark-700">
        <div
          className="h-full rounded bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AgentRow({
  node,
  color,
  metricLabel,
  metricValue,
  onSelect,
}: {
  node: NodeData;
  color: string;
  metricLabel: string;
  metricValue: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-dark-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1 truncate text-gray-200">
        Agent {node.agent_id}
      </span>
      <span className="shrink-0 text-xs text-gray-500">
        {metricLabel} {metricValue}
      </span>
    </button>
  );
}

export function ClusterDetail({ stats, onSelectAgent }: ClusterDetailProps) {
  const [showAllTraits, setShowAllTraits] = useState(false);

  const sortedTraits = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.traitAverages).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  const topTraits = sortedTraits.slice(0, 5);
  const restTraits = sortedTraits.slice(5);

  if (!stats) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-gray-500">
        <p className="text-sm">Select a cluster</p>
      </div>
    );
  }

  const color = getClusterColor(stats.clusterId);
  const topInfluencerCentrality =
    stats.topInfluencers[0]?.betweenness_centrality ??
    stats.topInfluencers[0]?.degree_centrality ??
    0;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-dark-700 p-4">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="text-lg font-semibold text-white">Cluster {stats.clusterId}</h2>
          <span className="rounded bg-dark-700 px-2 py-0.5 text-xs font-medium text-gray-300">
            {stats.nodeCount} agents
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-400">{stats.oneLiner}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 border-b border-dark-700 p-4">
        <div className="rounded-lg bg-dark-700 p-3">
          <div className="text-xs text-gray-500">Avg degree</div>
          <div className="text-lg font-semibold text-white tabular-nums">
            {formatNumber(stats.avgDegree, 1)}
          </div>
        </div>
        <div className="rounded-lg bg-dark-700 p-3">
          <div className="text-xs text-gray-500">Cohesion</div>
          <div className="text-lg font-semibold text-white tabular-nums">
            {(stats.cohesion * 100).toFixed(0)}%
          </div>
        </div>
        <div className="rounded-lg bg-dark-700 p-3">
          <div className="text-xs text-gray-500">External links</div>
          <div className="text-lg font-semibold text-white tabular-nums">
            {(stats.externalConnectivity * 100).toFixed(0)}%
          </div>
        </div>
        <div className="rounded-lg bg-dark-700 p-3">
          <div className="text-xs text-gray-500">Top influencer</div>
          <div className="text-lg font-semibold text-white tabular-nums">
            {formatNumber(topInfluencerCentrality, 3)}
          </div>
        </div>
      </div>

      {/* Top traits */}
      <div className="border-b border-dark-700 p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
          Top traits
        </h3>
        <div className="space-y-3">
          {(showAllTraits ? sortedTraits : topTraits).map(([name, value]) => (
            <TraitBar key={name} label={name} value={value} />
          ))}
        </div>
        {restTraits.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAllTraits((v) => !v)}
            className="mt-3 text-xs text-accent hover:underline"
          >
            {showAllTraits ? "Show less" : `Show all traits (${sortedTraits.length})`}
          </button>
        )}
      </div>

      {/* Top influencers */}
      <div className="border-b border-dark-700 p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          Top influencers
        </h3>
        <div className="space-y-0.5">
          {stats.topInfluencers.map((node) => (
            <AgentRow
              key={node.agent_id}
              node={node}
              color={color}
              metricLabel="BC"
              metricValue={formatNumber(node.betweenness_centrality ?? 0, 3)}
              onSelect={() => onSelectAgent(String(node.agent_id))}
            />
          ))}
        </div>
      </div>

      {/* Bridge nodes */}
      <div className="p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          Bridge nodes
        </h3>
        <div className="space-y-0.5">
          {stats.bridgeNodes.map((node) => (
            <AgentRow
              key={node.agent_id}
              node={node}
              color={color}
              metricLabel="BC"
              metricValue={formatNumber(node.betweenness_centrality ?? 0, 3)}
              onSelect={() => onSelectAgent(String(node.agent_id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

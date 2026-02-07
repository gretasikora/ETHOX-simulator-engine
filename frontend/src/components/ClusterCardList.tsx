import { useMemo, useState } from "react";
import type { ClusterStats } from "../utils/clusterStats";
import { formatTraitLabel } from "../utils/traits";
import { getClusterColor } from "../utils/color";

type SortKey = "size" | "cohesion" | "influence";

interface ClusterCardListProps {
  stats: ClusterStats[];
  selectedClusterId: number | null;
  onSelectCluster: (id: number) => void;
}

export function ClusterCardList({
  stats,
  selectedClusterId,
  onSelectCluster,
}: ClusterCardListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("size");

  const filteredAndSorted = useMemo(() => {
    let list = stats;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          String(s.clusterId).toLowerCase().includes(q) ||
          String(s.clusterId) === q
      );
    }
    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "size":
          return b.nodeCount - a.nodeCount;
        case "cohesion":
          return b.cohesion - a.cohesion;
        case "influence": {
          const infA = a.topInfluencers[0]?.betweenness_centrality ?? a.topInfluencers[0]?.degree_centrality ?? 0;
          const infB = b.topInfluencers[0]?.betweenness_centrality ?? b.topInfluencers[0]?.degree_centrality ?? 0;
          return infB - infA;
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [stats, search, sortBy]);

  const topTraitFor = (s: ClusterStats) => {
    const entries = Object.entries(s.traitAverages).sort((a, b) => b[1] - a[1]);
    return entries[0];
  };

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-dark-700 p-3">
        <input
          type="text"
          placeholder="Search by cluster id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex gap-1">
          {(["size", "cohesion", "influence"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                sortBy === key
                  ? "bg-accent text-white"
                  : "bg-dark-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredAndSorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No clusters match</p>
        ) : (
          <div className="space-y-2">
            {filteredAndSorted.map((s) => {
              const top = topTraitFor(s);
              const color = getClusterColor(s.clusterId);
              const isSelected = selectedClusterId === s.clusterId;
              return (
                <button
                  key={s.clusterId}
                  type="button"
                  onClick={() => onSelectCluster(s.clusterId)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-accent bg-dark-700"
                      : "border-dark-700 bg-dark-800 hover:border-dark-600 hover:bg-dark-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-white">Cluster {s.clusterId}</span>
                    <span className="rounded bg-dark-700 px-1.5 py-0.5 text-xs text-gray-400">
                      {s.nodeCount} agents
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Cohesion {(s.cohesion * 100).toFixed(0)}%
                    </span>
                    {top && (
                      <span className="rounded bg-dark-700 px-1.5 py-0.5 text-xs text-gray-400">
                        {formatTraitLabel(top[0])} {top[1].toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

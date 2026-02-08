import { useEffect, useState } from "react";
import { fetchNodeDetail, type NodeDetailResponse } from "../api/client";
import { useUIStore } from "../store/useUIStore";
import { StatCard } from "./StatCard";

export function NodeDetailsPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const [detail, setDetail] = useState<NodeDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedNodeId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetchNodeDetail(selectedNodeId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [selectedNodeId]);

  if (selectedNodeId == null) return null;

  return (
    <div
      className="absolute right-0 top-0 z-20 flex h-full w-[340px] flex-col border-l border-dark-700 bg-dark-800 shadow-xl transition-transform duration-200 ease-out"
      style={{ transform: "translateX(0)" }}
    >
      <div className="flex items-center justify-between border-b border-dark-700 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">
            Agent #{selectedNodeId}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setSelectedNode(null)}
          className="rounded p-1 text-gray-400 hover:bg-dark-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
        {!loading && detail && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Degree" value={detail.node.degree} />
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Behavioral Traits
              </h3>
              <div className="space-y-2">
                {Object.entries(detail.node.traits || {}).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{key}</span>
                      <span className="text-gray-300">{value.toFixed(2)}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded bg-dark-700">
                      <div
                        className="h-full rounded bg-accent"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Connections ({detail.neighbors.length})
              </h3>
              <div className="max-h-[300px] space-y-1 overflow-y-auto">
                {detail.neighbors
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 20)
                  .map((n) => (
                    <button
                      key={n.agent_id}
                      type="button"
                      onClick={() => setSelectedNode(n.agent_id)}
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-dark-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                        {n.agent_id}
                      </span>
                      <span className="shrink-0 rounded bg-dark-700 px-1.5 py-0.5 text-xs text-gray-400">
                        w:{n.weight.toFixed(2)}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        deg {n.degree}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

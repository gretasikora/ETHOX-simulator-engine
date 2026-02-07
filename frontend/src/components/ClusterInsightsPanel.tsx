import { useMemo, useEffect } from "react";
import { useGraphStore } from "../store/useGraphStore";
import { useUIStore } from "../store/useUIStore";
import { computeClusterStats } from "../utils/clusterStats";
import { ClusterCardList } from "./ClusterCardList";
import { ClusterDetail } from "./ClusterDetail";

interface ClusterInsightsPanelProps {
  onSelectAgent: (agentId: string) => void;
}

export function ClusterInsightsPanel({ onSelectAgent }: ClusterInsightsPanelProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const filters = useUIStore((s) => s.filters);
  const selectedClusterId = useUIStore((s) => s.selectedClusterId);
  const setSelectedClusterId = useUIStore((s) => s.setSelectedClusterId);

  const statsList = useMemo(
    () => computeClusterStats(nodes, edges, filters.clusters),
    [nodes, edges, filters.clusters]
  );

  const selectedStats = useMemo(
    () => statsList.find((s) => s.clusterId === selectedClusterId) ?? null,
    [statsList, selectedClusterId]
  );

  useEffect(() => {
    if (statsList.length === 0) {
      setSelectedClusterId(null);
      return;
    }
    const currentStillVisible = selectedClusterId != null && statsList.some((s) => s.clusterId === selectedClusterId);
    if (!currentStillVisible) {
      setSelectedClusterId(statsList[0]?.clusterId ?? null);
    }
  }, [statsList, selectedClusterId, setSelectedClusterId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 min-h-0">
        <div className="w-56 shrink-0 border-r border-dark-700">
          <ClusterCardList
            stats={statsList}
            selectedClusterId={selectedClusterId}
            onSelectCluster={setSelectedClusterId}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ClusterDetail stats={selectedStats} onSelectAgent={onSelectAgent} />
        </div>
      </div>
    </div>
  );
}

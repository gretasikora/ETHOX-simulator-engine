import { useMemo, useCallback } from "react";
import { useGraphStore } from "../store/useGraphStore";
import { useUIStore } from "../store/useUIStore";
import {
  buildAdjacency,
  bfsShortestPath,
  dijkstraInfluencePath,
  kHopNeighborhood,
  pathToEdgeKeys,
  neighborhoodEdgeKeys,
} from "../utils/graphAlgorithms";

export function GraphExploreControls() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const visibleNodeIds = useUIStore((s) => s.visibleNodeIds);

  const exploreMode = useUIStore((s) => s.exploreMode);
  const pathFrom = useUIStore((s) => s.pathFrom);
  const pathTo = useUIStore((s) => s.pathTo);
  const neighborhoodCenter = useUIStore((s) => s.neighborhoodCenter);
  const exploreHops = useUIStore((s) => s.exploreHops);
  const preferInfluence = useUIStore((s) => s.preferInfluence);
  const exploreStatus = useUIStore((s) => s.exploreStatus);

  const setPathFrom = useUIStore((s) => s.setPathFrom);
  const setPathTo = useUIStore((s) => s.setPathTo);
  const setNeighborhoodCenter = useUIStore((s) => s.setNeighborhoodCenter);
  const setExploreHops = useUIStore((s) => s.setExploreHops);
  const setPreferInfluence = useUIStore((s) => s.setPreferInfluence);
  const setHighlighted = useUIStore((s) => s.setHighlighted);
  const clearHighlight = useUIStore((s) => s.clearHighlight);
  const setExploreStatus = useUIStore((s) => s.setExploreStatus);

  const adj = useMemo(() => buildAdjacency(edges), [edges]);
  const nodesById = useMemo(() => {
    const m = new Map<string, import("../api/client").NodeData>();
    nodes.forEach((n) => m.set(String(n.agent_id), n));
    return m;
  }, [nodes]);

  const visibleSet = useMemo(() => new Set(visibleNodeIds), [visibleNodeIds]);
  const fromVisible = pathFrom ? visibleSet.has(pathFrom) : true;
  const toVisible = pathTo ? visibleSet.has(pathTo) : true;
  const centerVisible = neighborhoodCenter ? visibleSet.has(neighborhoodCenter) : true;
  const pathDisabled = !pathFrom || !pathTo || !fromVisible || !toVisible;

  const handleFindPath = useCallback(() => {
    if (!pathFrom || !pathTo || pathDisabled) return;
    const path = preferInfluence
      ? dijkstraInfluencePath(adj, nodesById, pathFrom, pathTo)
      : bfsShortestPath(adj, pathFrom, pathTo);
    if (path) {
      const edgeKeys = pathToEdgeKeys(path);
      setHighlighted(path, Array.from(edgeKeys));
      setExploreStatus(`Path length: ${path.length}`);
    } else {
      setHighlighted([], []);
      setExploreStatus("No path found");
    }
  }, [pathFrom, pathTo, pathDisabled, preferInfluence, adj, nodesById, setHighlighted, setExploreStatus]);

  const handleHighlightNeighborhood = useCallback(() => {
    if (!neighborhoodCenter || !centerVisible) return;
    const nodeSet = kHopNeighborhood(adj, neighborhoodCenter, exploreHops);
    const edgeKeys = neighborhoodEdgeKeys(adj, nodeSet);
    setHighlighted(Array.from(nodeSet), Array.from(edgeKeys));
    setExploreStatus(`Nodes highlighted: ${nodeSet.size}`);
  }, [neighborhoodCenter, centerVisible, exploreHops, adj, setHighlighted, setExploreStatus]);

  if (exploreMode === "none") return null;

  return (
    <div className="surface-elevated absolute right-4 top-4 z-10 w-72 rounded-xl p-4 shadow-card backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-aurora-text0">Explore</span>
        <button
          type="button"
          onClick={clearHighlight}
          className="text-xs text-aurora-text1 hover:text-aurora-text0 transition-colors"
        >
          Clear highlight
        </button>
      </div>

      {exploreMode === "path" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-aurora-text2">From</label>
            <input
              type="text"
              value={pathFrom ?? ""}
              onChange={(e) => setPathFrom(e.target.value.trim() || null)}
              placeholder="Agent id"
              className="w-full rounded-lg border border-aurora-border bg-aurora-surface0 px-2.5 py-1.5 text-sm text-aurora-text0 placeholder-aurora-text2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1"
            />
            {pathFrom && !fromVisible && (
              <p className="mt-1 text-xs text-aurora-danger">Agent not visible under current filters</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-aurora-text2">To</label>
            <input
              type="text"
              value={pathTo ?? ""}
              onChange={(e) => setPathTo(e.target.value.trim() || null)}
              placeholder="Agent id"
              className="w-full rounded-lg border border-aurora-border bg-aurora-surface0 px-2.5 py-1.5 text-sm text-aurora-text0 placeholder-aurora-text2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1"
            />
            {pathTo && !toVisible && (
              <p className="mt-1 text-xs text-aurora-danger">Agent not visible under current filters</p>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={preferInfluence}
              onChange={(e) => setPreferInfluence(e.target.checked)}
              className="rounded border-aurora-border bg-aurora-surface2 text-aurora-accent1 focus:ring-aurora-accent1"
            />
            <span className="text-xs text-aurora-text1">Prefer influence</span>
          </label>
          <button
            type="button"
            onClick={handleFindPath}
            disabled={pathDisabled}
            className="aurora-gradient w-full rounded-xl py-2 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm disabled:opacity-50 transition-all"
          >
            Find Path
          </button>
          {exploreStatus && (
            <p className="text-xs text-aurora-text2">{exploreStatus}</p>
          )}
        </div>
      )}

      {exploreMode === "neighborhood" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-aurora-text2">Center agent</label>
            <input
              type="text"
              value={neighborhoodCenter ?? ""}
              onChange={(e) => setNeighborhoodCenter(e.target.value.trim() || null)}
              placeholder="Agent id or click node"
              className="w-full rounded-lg border border-aurora-border bg-aurora-surface0 px-2.5 py-1.5 text-sm text-aurora-text0 placeholder-aurora-text2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1"
            />
            {neighborhoodCenter && !centerVisible && (
              <p className="mt-1 text-xs text-aurora-danger">Agent not visible under current filters</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-aurora-text2">Hops: {exploreHops}</label>
            <input
              type="range"
              min={1}
              max={3}
              value={exploreHops}
              onChange={(e) => setExploreHops(Number(e.target.value))}
              className="w-full [accent-color:var(--accent-1)]"
            />
          </div>
          <button
            type="button"
            onClick={handleHighlightNeighborhood}
            disabled={!neighborhoodCenter || !centerVisible}
            className="aurora-gradient w-full rounded-xl py-2 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm disabled:opacity-50 transition-all"
          >
            Highlight
          </button>
          {exploreStatus && (
            <p className="text-xs text-aurora-text2">{exploreStatus}</p>
          )}
        </div>
      )}
    </div>
  );
}

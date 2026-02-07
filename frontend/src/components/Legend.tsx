import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { getClusterColor } from "../utils/color";

export function Legend() {
  const colorBy = useUIStore((s) => s.colorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const clusterList = useGraphStore((s) => s.clusterList);

  return (
    <div className="absolute bottom-4 right-4 z-10 rounded-lg border border-dark-700 bg-dark-800/90 px-3 py-2 shadow-lg backdrop-blur">
      <div className="space-y-2 text-xs">
        <div>
          <div className="mb-1 font-medium uppercase tracking-wider text-gray-400">
            Color
          </div>
          {colorBy === "cluster" && (
            <div className="flex flex-wrap gap-2">
              {clusterList.map((c) => (
                <div key={c.id} className="flex items-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getClusterColor(c.id) }}
                  />
                  <span className="text-gray-300">{c.id}</span>
                </div>
              ))}
            </div>
          )}
          {colorBy === "trait" && (
            <div>
              <div className="mb-1 text-gray-300">
                {selectedTrait || "Trait"}
              </div>
              <div
                className="h-2 w-32 rounded"
                style={{
                  background: "linear-gradient(to right, hsl(240,70%,55%), hsl(60,70%,55%))",
                }}
              />
              <div className="mt-0.5 flex justify-between text-gray-500">0 — 1</div>
            </div>
          )}
          {colorBy === "centrality" && (
            <div>
              <div
                className="h-2 w-32 rounded"
                style={{
                  background: "linear-gradient(to right, hsl(240,70%,55%), hsl(60,70%,55%))",
                }}
              />
              <div className="mt-0.5 flex justify-between text-gray-500">Low — High</div>
            </div>
          )}
        </div>
        <div>
          <div className="font-medium uppercase tracking-wider text-gray-400">Size</div>
          <div className="text-gray-300">
            {sizeBy === "degree" ? "Degree" : "Centrality"}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Listbox } from "@headlessui/react";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { MultiSelect } from "./MultiSelect";
import { RangeSlider } from "./RangeSlider";
import { exportFilteredSubgraph } from "../utils/graph";
import type Graph from "graphology";

interface LeftSidebarProps {
  graphRef: React.MutableRefObject<Graph | null>;
  onResetCamera: () => void;
  onExportSubgraph: () => void;
}

export function LeftSidebar({
  graphRef,
  onResetCamera,
  onExportSubgraph,
}: LeftSidebarProps) {
  const traitKeys = useGraphStore((s) => s.traitKeys);
  const clusterList = useGraphStore((s) => s.clusterList);

  const filters = useUIStore((s) => s.filters);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const setClusterFilter = useUIStore((s) => s.setClusterFilter);
  const setDegreeRange = useUIStore((s) => s.setDegreeRange);
  const setTraitRange = useUIStore((s) => s.setTraitRange);
  const setSelectedTrait = useUIStore((s) => s.setSelectedTrait);
  const resetFilters = useUIStore((s) => s.resetFilters);
  const toggleLabels = useUIStore((s) => s.toggleLabels);

  const nodes = useGraphStore((s) => s.nodes);
  const degreeMax = Math.max(
    1,
    ...nodes.map((n) => n.degree),
    0
  );

  const handleExport = () => {
    const g = graphRef.current;
    if (!g) return;
    const blob = exportFilteredSubgraph(g);
    const str = JSON.stringify(blob, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([str], { type: "application/json" }));
    a.download = "subgraph.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-dark-700 bg-dark-800">
      <div className="border-b border-dark-700 p-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span aria-hidden>◇</span> Society Explorer
        </h1>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <section>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
            Current Society
          </label>
          <Listbox as="div" className="relative">
            <Listbox.Button className="w-full rounded-lg border border-dark-700 bg-dark-700 px-3 py-2 text-left text-sm text-gray-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
              LinkedIn
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-dark-700 bg-dark-800 py-1 shadow">
              <Listbox.Option value="linkedin" className="cursor-pointer px-3 py-2 text-sm text-gray-200 hover:bg-dark-700">
                LinkedIn
              </Listbox.Option>
            </Listbox.Options>
          </Listbox>
        </section>

        <section>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
            Current View
          </label>
          <Listbox as="div" className="relative">
            <Listbox.Button className="w-full rounded-lg border border-dark-700 bg-dark-700 px-3 py-2 text-left text-sm text-gray-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
              Country
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-dark-700 bg-dark-800 py-1 shadow">
              <Listbox.Option value="country" className="cursor-pointer px-3 py-2 text-sm text-gray-200 hover:bg-dark-700">
                Country
              </Listbox.Option>
            </Listbox.Options>
          </Listbox>
        </section>

        <div className="border-t border-dark-700 pt-6">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Filters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs text-gray-500">Clusters</label>
              <MultiSelect
                options={clusterList}
                selected={filters.clusters}
                onChange={setClusterFilter}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-gray-500">
                Degree Range
              </label>
              <RangeSlider
                min={0}
                max={degreeMax}
                value={filters.degreeRange}
                onChange={setDegreeRange}
                step={1}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-gray-500">
                Trait Filter
              </label>
              <Listbox
                value={selectedTrait}
                onChange={setSelectedTrait}
                as="div"
                className="relative mb-2"
              >
                <Listbox.Button className="w-full rounded border border-dark-700 bg-dark-700 px-3 py-2 text-left text-sm text-gray-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
                  {selectedTrait || (traitKeys[0] ?? "Select trait")}
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-dark-700 bg-dark-800 py-1">
                  {traitKeys.map((k) => (
                    <Listbox.Option key={k} value={k} className="cursor-pointer px-3 py-2 text-sm text-gray-200 hover:bg-dark-700">
                      {k}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
              <RangeSlider
                min={0}
                max={1}
                value={filters.traitRange}
                onChange={setTraitRange}
                step={0.01}
              />
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded border border-dark-600 py-2 text-xs font-medium text-gray-300 hover:bg-dark-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mt-auto space-y-2 border-t border-dark-700 pt-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Actions
          </h2>
          <button
            type="button"
            onClick={toggleLabels}
            className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm text-gray-200 hover:bg-dark-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Toggle Labels
          </button>
          <button
            type="button"
            onClick={onResetCamera}
            className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm text-gray-200 hover:bg-dark-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Reset Camera
          </button>
          <button
            type="button"
            onClick={() => {
              handleExport();
              onExportSubgraph?.();
            }}
            className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm text-gray-200 hover:bg-dark-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Export Subgraph
          </button>
        </div>
      </div>
    </aside>
  );
}

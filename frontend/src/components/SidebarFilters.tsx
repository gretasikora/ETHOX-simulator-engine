import { useState } from "react";
import { Listbox } from "@headlessui/react";
import { Filter, PanelLeftClose, RotateCcw, Tag, SlidersHorizontal } from "lucide-react";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { RangeSlider } from "./RangeSlider";
import { exportFilteredSubgraph } from "../utils/graph";
import { getAgeColor, AGE_COLOR_MIN, AGE_COLOR_MAX } from "../utils/color";
import type Graph from "graphology";

interface SidebarFiltersProps {
  graphRef: React.MutableRefObject<Graph | null>;
  onResetCamera: () => void;
  onExportSubgraph?: () => void;
}

export function SidebarFilters({
  graphRef,
  onResetCamera,
  onExportSubgraph,
}: SidebarFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const traitKeys = useGraphStore((s) => s.traitKeys);
  const filters = useUIStore((s) => s.filters);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const setDegreeRange = useUIStore((s) => s.setDegreeRange);
  const setTraitRange = useUIStore((s) => s.setTraitRange);
  const setSelectedTrait = useUIStore((s) => s.setSelectedTrait);
  const resetFilters = useUIStore((s) => s.resetFilters);
  const toggleLabels = useUIStore((s) => s.toggleLabels);
  const showAgeEncoding = useUIStore((s) => s.showAgeEncoding);
  const showGenderEncoding = useUIStore((s) => s.showGenderEncoding);
  const setShowAgeEncoding = useUIStore((s) => s.setShowAgeEncoding);
  const setShowGenderEncoding = useUIStore((s) => s.setShowGenderEncoding);

  const nodes = useGraphStore((s) => s.nodes);
  const degreeMax = Math.max(1, ...nodes.map((n) => n.degree), 0);

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

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-aurora-border p-4 lg:justify-start lg:gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-aurora-text1" />
          <h2 className="text-sm font-semibold text-aurora-text0">Filters</h2>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0 lg:hidden"
          aria-label="Close filters"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="border-t border-aurora-border pt-0">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
            Node encoding
          </h3>
          <div className="rounded-xl border border-aurora-border bg-aurora-surface0/80 p-3 space-y-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm text-aurora-text1">Show age (color)</span>
              <input
                type="checkbox"
                checked={showAgeEncoding}
                onChange={(e) => setShowAgeEncoding(e.target.checked)}
                className="h-4 w-4 rounded border-aurora-border text-aurora-accent1 focus:ring-aurora-accent1"
              />
            </label>
            {showAgeEncoding && (
              <div>
                <p className="mb-1 text-xs text-aurora-text2">Age gradient</p>
                <div
                  className="h-2 w-full rounded"
                  style={{
                    background: `linear-gradient(to right, ${getAgeColor(AGE_COLOR_MIN)}, ${getAgeColor((AGE_COLOR_MIN + AGE_COLOR_MAX) / 2)}, ${getAgeColor(AGE_COLOR_MAX)})`,
                  }}
                />
                <p className="mt-0.5 flex justify-between text-xs text-aurora-text2">
                  {AGE_COLOR_MIN} → {AGE_COLOR_MAX}
                </p>
              </div>
            )}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm text-aurora-text1">Show gender (shape)</span>
              <input
                type="checkbox"
                checked={showGenderEncoding}
                onChange={(e) => setShowGenderEncoding(e.target.checked)}
                className="h-4 w-4 rounded border-aurora-border text-aurora-accent1 focus:ring-aurora-accent1"
              />
            </label>
            {showGenderEncoding && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-aurora-text2">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-current" /> Male</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 border border-current" style={{ borderRadius: 2 }} /> Female</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-aurora-border pt-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
            Degree range
          </h3>
          <div className="rounded-xl border border-aurora-border bg-aurora-surface0/80 p-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={degreeMax}
                value={filters.degreeRange[0]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) {
                    const low = Math.max(0, Math.min(v, filters.degreeRange[1]));
                    setDegreeRange([low, filters.degreeRange[1]]);
                  }
                }}
                className="w-full rounded-lg border border-aurora-border bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Degree min"
              />
              <span className="shrink-0 text-aurora-text2">–</span>
              <input
                type="number"
                min={0}
                max={degreeMax}
                value={filters.degreeRange[1]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) {
                    const high = Math.max(filters.degreeRange[0], Math.min(degreeMax, v));
                    setDegreeRange([filters.degreeRange[0], high]);
                  }
                }}
                className="w-full rounded-lg border border-aurora-border bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Degree max"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-aurora-border pt-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
            Trait filter
          </h3>
          <div className="rounded-xl border border-aurora-border bg-aurora-surface0/80 p-3">
            <Listbox
              value={selectedTrait}
              onChange={setSelectedTrait}
              as="div"
              className="relative mb-3"
            >
              <Listbox.Button className="flex w-full items-center gap-2 rounded-lg border border-aurora-border bg-aurora-surface1 px-3 py-2 text-left text-sm text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1">
                <Tag className="h-4 w-4 shrink-0 text-aurora-text2" />
                {selectedTrait || (traitKeys[0] ?? "Select trait")}
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-aurora-border bg-aurora-surface1 py-1 shadow-card">
                {traitKeys.map((k) => (
                  <Listbox.Option
                    key={k}
                    value={k}
                    className="cursor-pointer px-3 py-2 text-sm text-aurora-text0 hover:bg-aurora-surface2"
                  >
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
            <p className="mt-2 flex justify-between text-xs text-aurora-text2">
              <span>{filters.traitRange[0].toFixed(2)}</span>
              <span>{filters.traitRange[1].toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-aurora-border pt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-aurora-text2">
            Actions
          </h3>
          <button
            type="button"
            onClick={toggleLabels}
            className="flex items-center gap-2 rounded-xl border border-aurora-border bg-aurora-surface1 px-3 py-2.5 text-sm font-medium text-aurora-text0 transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Toggle Labels
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-aurora-text1 transition-all hover:bg-aurora-surface2 hover:text-aurora-text0"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onResetCamera}
            className="flex items-center gap-2 rounded-xl border border-aurora-border bg-aurora-surface1 px-3 py-2.5 text-sm font-medium text-aurora-text0 transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1"
          >
            Reset Camera
          </button>
          <button
            type="button"
            onClick={() => {
              handleExport();
              onExportSubgraph?.();
            }}
            className="flex items-center gap-2 rounded-xl border border-aurora-border bg-aurora-surface1 px-3 py-2.5 text-sm font-medium text-aurora-text0 transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1"
          >
            Export Subgraph
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-[320px] shrink-0 flex-col border-r border-aurora-border bg-aurora-bg1 lg:flex">
        {content}
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-aurora-border bg-aurora-surface1 shadow-card text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0 lg:hidden"
        aria-label="Open filters"
      >
        <Filter className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-aurora-bg0/80 backdrop-blur-sm lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-40 flex w-[min(100%,320px)] flex-col border-r border-aurora-border bg-aurora-bg1 shadow-xl lg:hidden"
            role="dialog"
            aria-label="Filters"
          >
            {content}
          </div>
        </>
      )}
    </>
  );
}

import { useState } from "react";
import { Listbox } from "@headlessui/react";
import { Filter, PanelLeftClose, PanelRightOpen, RotateCcw, Tag, SlidersHorizontal, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { RangeSlider } from "./RangeSlider";
import { exportFilteredSubgraph } from "../utils/graph";
import { getAgeColor, AGE_COLOR_MIN, AGE_COLOR_MAX } from "../utils/color";
import type Graph from "graphology";

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_RAIL = 52;

interface SidebarFiltersProps {
  graphRef: React.MutableRefObject<Graph | null>;
  onResetCamera: () => void;
  onExportSubgraph?: () => void;
}

function SectionHeader({
  label,
  open,
  onToggle,
  hint,
  badge,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  hint?: string;
  badge?: string;
}) {
  return (
    <div className="mb-2 flex w-full items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 items-center gap-1.5 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-aurora-text2/90 hover:text-aurora-text2"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        <span>{label}</span>
      </button>
      {badge && (
        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] uppercase tracking-wider text-aurora-text2/60">
          {badge}
        </span>
      )}
      {hint && (
        <span
          className="shrink-0 rounded p-0.5 text-aurora-text2/60 hover:text-aurora-text2"
          title={hint}
        >
          <HelpCircle className="h-3 w-3" />
        </span>
      )}
    </div>
  );
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
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const filtersSectionOpen = useUIStore((s) => s.filtersSectionOpen);
  const setFiltersSectionOpen = useUIStore((s) => s.setFiltersSectionOpen);

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
      <div className="flex shrink-0 items-center justify-between border-b border-aurora-border/70 p-3 lg:justify-start lg:gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-aurora-text1/90" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-aurora-text1/90">Filters</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            className="rounded-md p-1.5 text-aurora-text2 hover:bg-aurora-surface2/80 hover:text-aurora-text1"
            aria-label="Collapse filters"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0 lg:hidden"
            aria-label="Close filters"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="pt-3">
          <SectionHeader
            label="Node encoding"
            open={filtersSectionOpen.nodeEncoding}
            onToggle={() => setFiltersSectionOpen("nodeEncoding", !filtersSectionOpen.nodeEncoding)}
            hint="Color = selected encoding (age or trait). Shape = gender when enabled."
          />
          {filtersSectionOpen.nodeEncoding && (
          <div className="rounded-lg border border-aurora-border/60 bg-aurora-surface0/60 p-2.5 space-y-3">
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
            {showGenderEncoding && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-aurora-text2">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-current" /> Male</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 border border-current" style={{ borderRadius: 2 }} /> Female</span>
              </div>
            )}
          </div>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-aurora-border/50">
          <SectionHeader
            label="Degree range"
            open={filtersSectionOpen.degreeRange}
            onToggle={() => setFiltersSectionOpen("degreeRange", !filtersSectionOpen.degreeRange)}
          />
          {filtersSectionOpen.degreeRange && (
          <div className="rounded-lg border border-aurora-border/60 bg-aurora-surface0/60 p-2.5">
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
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-aurora-border/50">
          <SectionHeader
            label="Trait filter"
            open={filtersSectionOpen.traitFilter}
            onToggle={() => setFiltersSectionOpen("traitFilter", !filtersSectionOpen.traitFilter)}
            badge="Advanced"
          />
          {filtersSectionOpen.traitFilter && (
          <div className="rounded-lg border border-aurora-border/60 bg-aurora-surface0/60 p-2.5">
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
          )}
        </div>

        <div className="mt-5 flex flex-col gap-1.5 border-t border-aurora-border/50 pt-5">
          <span className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-aurora-text2/80">Actions</span>
          <button
            type="button"
            onClick={toggleLabels}
            className="flex items-center gap-2 rounded-lg border border-aurora-border/60 bg-aurora-surface1/80 px-2.5 py-2 text-xs font-medium text-aurora-text0 transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/60"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Toggle Labels
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-aurora-text1 transition-all hover:bg-aurora-surface2/80 hover:text-aurora-text0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onResetCamera}
            className="flex items-center gap-2 rounded-lg border border-aurora-border/60 bg-aurora-surface1/80 px-2.5 py-2 text-xs font-medium text-aurora-text0 transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/60"
          >
            Reset Camera
          </button>
          <button
            type="button"
            onClick={() => {
              handleExport();
              onExportSubgraph?.();
            }}
            className="flex items-center gap-2 rounded-lg border border-aurora-border/60 bg-aurora-surface1/80 px-2.5 py-2 text-xs font-medium text-aurora-text0 transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/60"
          >
            Export Subgraph
          </button>
        </div>
      </div>
    </div>
  );

  const rail = (
    <div className="flex h-full w-full flex-col items-center border-r border-aurora-border/60 bg-aurora-bg0/95 py-3">
      <button
        type="button"
        onClick={() => setSidebarCollapsed(false)}
        className="rounded-md p-2 text-aurora-text2 hover:bg-aurora-surface2/80 hover:text-aurora-text1"
        aria-label="Expand filters"
      >
        <PanelRightOpen className="h-5 w-5 rotate-180" />
      </button>
      <div className="mt-2 flex flex-col gap-1">
        <span className="rounded-md p-2 text-aurora-text2/70" title="Filters">
          <Filter className="h-4 w-4" />
        </span>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden shrink-0 flex-col border-r border-aurora-border/70 bg-aurora-bg0/98 lg:flex"
        style={{ width: sidebarCollapsed ? SIDEBAR_WIDTH_RAIL : SIDEBAR_WIDTH_EXPANDED }}
      >
        {sidebarCollapsed ? rail : content}
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
            className="fixed inset-y-0 left-0 z-40 flex w-[min(100%,260px)] flex-col border-r border-aurora-border/70 bg-aurora-bg0/98 shadow-xl lg:hidden"
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

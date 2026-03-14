import { useState, useEffect } from "react";
import { Listbox } from "@headlessui/react";
import { PanelLeftClose, PanelRightOpen, Tag, ChevronDown, ChevronRight, HelpCircle, Home, Clock, Grid3x3, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { useSimulationStore } from "../store/useSimulationStore";
import { RangeSlider } from "./RangeSlider";
import { getAgeColor, AGE_COLOR_MIN, AGE_COLOR_MAX } from "../utils/color";
import { fetchRecentSimulations, fetchSimulationById, type RecentSimulation } from "../api/client";
import type Graph from "graphology";

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_RAIL = 52;

interface SidebarFiltersProps {
  graphRef: React.MutableRefObject<Graph | null>;
  onResetCamera?: () => void;
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
        className="flex flex-1 items-center gap-1.5 text-left text-xs font-medium uppercase tracking-[0.12em] text-aurora-text2/90 hover:text-aurora-text2"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <span>{label}</span>
      </button>
      {badge && (
        <span className="shrink-0 rounded px-1 py-0.5 text-[10px] uppercase tracking-wider text-aurora-text2/60">
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentSimulations, setRecentSimulations] = useState<RecentSimulation[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingSimId, setLoadingSimId] = useState<string | null>(null);

  const traitKeys = useGraphStore((s) => s.traitKeys);
  const filters = useUIStore((s) => s.filters);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const setDegreeRange = useUIStore((s) => s.setDegreeRange);
  const setTraitRange = useUIStore((s) => s.setTraitRange);
  const setSelectedTrait = useUIStore((s) => s.setSelectedTrait);
  const showAgeEncoding = useUIStore((s) => s.showAgeEncoding);
  const showGenderEncoding = useUIStore((s) => s.showGenderEncoding);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const filtersSectionOpen = useUIStore((s) => s.filtersSectionOpen);
  const setFiltersSectionOpen = useUIStore((s) => s.setFiltersSectionOpen);
  const graphViewMode = useUIStore((s) => s.graphViewMode);
  const setGraphViewMode = useUIStore((s) => s.setGraphViewMode);

  const setGraphData = useGraphStore((s) => s.setGraphData);
  const simulationStore = useSimulationStore();

  const nodes = useGraphStore((s) => s.nodes);
  const degreeMax = Math.max(1, ...nodes.map((n) => n.degree), 0);

  // Fetch recent simulations on mount
  useEffect(() => {
    const loadRecent = async () => {
      setLoadingRecent(true);
      try {
        const sims = await fetchRecentSimulations();
        setRecentSimulations(sims);
      } catch (err) {
        console.error("Failed to load recent simulations:", err);
      } finally {
        setLoadingRecent(false);
      }
    };
    loadRecent();
  }, []);

  const handleLoadSimulation = async (simId: string) => {
    setLoadingSimId(simId);
    try {
      const data = await fetchSimulationById(simId);

      // Normalize the data (same as in useSimulationStore)
      const normalizeNode = (n: any) => ({
        agent_id: String(n.agent_id),
        degree: n.degree ?? 0,
        traits: n.traits ?? {},
        degree_centrality: n.degree_centrality ?? 0,
        betweenness_centrality: n.betweenness_centrality ?? 0,
        age: n.age,
        gender: n.gender,
        level_of_care: n.level_of_care,
        effect_on_usage: n.effect_on_usage,
        text_opinion: n.text_opinion,
      });

      const normalizeGraph = (g: any) => ({
        nodes: g.nodes.map(normalizeNode),
        edges: g.edges.map((e: any) => ({
          source: String(e.source),
          target: String(e.target),
          weight: e.weight ?? 1,
        })),
      });

      const initial = normalizeGraph(data.initial_graph);
      const postTrigger = normalizeGraph(data.post_trigger_graph);
      const final = normalizeGraph(data.final_graph);

      // Load the simulation into the store
      simulationStore.setSimulationInput(data.trigger_event || "", data.num_agents || 100);

      // Set the graphs
      setGraphData(final.nodes, final.edges);

      // Update simulation store
      useSimulationStore.setState({
        simulationId: simId,
        initialGraph: initial,
        postTriggerGraph: postTrigger,
        finalGraph: final,
        status: "finished",
        phase: "finished",
        viewMode: "simulation",
        // Load saved report if available
        reportStatus: data.saved_report ? "ready" : "idle",
        reportText: data.saved_report?.report_text,
        reportCareScore100: data.saved_report?.care_score_100,
        reportUsageEffect50: data.saved_report?.change_in_support_50,
        reportIncludeInitial: data.saved_report?.include_initial ?? false,
      });

    } catch (err) {
      console.error("Failed to load simulation:", err);
      useUIStore.getState().addToast("Failed to load simulation", "error");
    } finally {
      setLoadingSimId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end p-3">
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
        {/* View Toggle */}
        <div className="mb-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGraphViewMode("2d")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-all ${
                graphViewMode === "2d"
                  ? "bg-aurora-accent1/20 text-aurora-accent1"
                  : "bg-aurora-surface1 text-aurora-text2 hover:bg-aurora-surface2 hover:text-aurora-text1"
              }`}
            >
              <Grid3x3 className="h-5 w-5" />
              2D
            </button>
            <button
              type="button"
              onClick={() => setGraphViewMode("3d")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-all ${
                graphViewMode === "3d"
                  ? "bg-aurora-accent1/20 text-aurora-accent1"
                  : "bg-aurora-surface1 text-aurora-text2 hover:bg-aurora-surface2 hover:text-aurora-text1"
              }`}
            >
              <Layers3 className="h-5 w-5" />
              3D
            </button>
          </div>
        </div>

        {/* Visual Encoding */}
        <div className="mb-5 rounded-lg bg-aurora-surface0/60 p-3 space-y-3">
          {showAgeEncoding && (
            <div>
              <p className="mb-1.5 text-base text-aurora-text1">Color: Age</p>
              <div
                className="h-2.5 w-full rounded"
                style={{
                  background: `linear-gradient(to right, ${getAgeColor(AGE_COLOR_MIN)}, ${getAgeColor((AGE_COLOR_MIN + AGE_COLOR_MAX) / 2)}, ${getAgeColor(AGE_COLOR_MAX)})`,
                }}
              />
            </div>
          )}
          <div>
            <p className="text-base text-aurora-text1">Size: Influence</p>
          </div>
        </div>

        <div className="mt-5">
          <SectionHeader
            label="Degree range"
            open={filtersSectionOpen.degreeRange}
            onToggle={() => setFiltersSectionOpen("degreeRange", !filtersSectionOpen.degreeRange)}
          />
          {filtersSectionOpen.degreeRange && (
          <div className="rounded-lg bg-aurora-surface0/60 p-2.5">
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
                className="w-full rounded-lg bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-full rounded-lg bg-aurora-surface1 px-3 py-2 text-sm text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Degree max"
              />
            </div>
          </div>
          )}
        </div>

        <div className="mt-5">
          <SectionHeader
            label="Trait filter"
            open={filtersSectionOpen.traitFilter}
            onToggle={() => setFiltersSectionOpen("traitFilter", !filtersSectionOpen.traitFilter)}
            badge="Advanced"
          />
          {filtersSectionOpen.traitFilter && (
          <div className="rounded-lg bg-aurora-surface0/60 p-2.5">
            <Listbox
              value={selectedTrait}
              onChange={setSelectedTrait}
              as="div"
              className="relative mb-3"
            >
              <Listbox.Button className="flex w-full items-center gap-2 rounded-lg bg-aurora-surface1 px-3 py-2 text-left text-sm text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1">
                <Tag className="h-4 w-4 shrink-0 text-aurora-text2" />
                {selectedTrait || (traitKeys[0] ?? "Select trait")}
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-aurora-surface1 py-1 shadow-card">
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

        {/* Previous Simulations */}
        <div className="mt-5">
          <SectionHeader
            label="Previous Simulations"
            open={filtersSectionOpen.previousSimulations}
            onToggle={() => setFiltersSectionOpen("previousSimulations", !filtersSectionOpen.previousSimulations)}
          />
          {filtersSectionOpen.previousSimulations && (
            <div className="space-y-2">
              {loadingRecent ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-aurora-accent1 border-t-transparent" />
                </div>
              ) : recentSimulations.length === 0 ? (
                <p className="py-3 text-center text-sm text-aurora-text2">No recent simulations</p>
              ) : (
                recentSimulations.map((sim) => (
                  <button
                    key={sim.id}
                    type="button"
                    onClick={() => handleLoadSimulation(sim.id)}
                    disabled={loadingSimId === sim.id}
                    className="w-full rounded-lg bg-aurora-surface1/80 px-3 py-2.5 text-left transition-all hover:bg-aurora-surface2 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/60 disabled:opacity-50 disabled:cursor-wait"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-aurora-text0 line-clamp-2">
                          {sim.trigger_event}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-aurora-text2">
                          <span>{sim.num_agents} agents</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(sim.completed_at)}
                          </span>
                        </div>
                      </div>
                      {loadingSimId === sim.id && (
                        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-aurora-accent1 border-t-transparent" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* New Simulation Button */}
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="aurora-gradient flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-aurora-bg0 shadow-aurora-glow-sm transition-all hover:opacity-95 hover:shadow-aurora-glow active:scale-[0.98]"
          >
            <Home className="h-5 w-5" />
            New Simulation
          </button>
        </div>
      </div>
    </div>
  );

  const rail = (
    <div className="flex h-full w-full flex-col items-center bg-aurora-bg0/95 py-3">
      <button
        type="button"
        onClick={() => setSidebarCollapsed(false)}
        className="rounded-md p-2 text-aurora-text2 hover:bg-aurora-surface2/80 hover:text-aurora-text1"
        aria-label="Expand filters"
      >
        <PanelRightOpen className="h-5 w-5 rotate-180" />
      </button>
    </div>
  );

  return (
    <>
      <aside
        className="hidden shrink-0 flex-col bg-aurora-bg0/98 lg:flex"
        style={{ width: sidebarCollapsed ? SIDEBAR_WIDTH_RAIL : SIDEBAR_WIDTH_EXPANDED }}
      >
        {sidebarCollapsed ? rail : content}
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-surface1 shadow-card text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0 lg:hidden"
        aria-label="Open sidebar"
      >
        <PanelRightOpen className="h-5 w-5 rotate-180" />
      </button>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-aurora-bg0/80 backdrop-blur-sm lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-40 flex w-[min(100%,260px)] flex-col bg-aurora-bg0/98 shadow-xl lg:hidden"
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

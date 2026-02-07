import { Link } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import { Search, LayoutGrid, FlaskConical, ChevronUp, Play } from "lucide-react";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { useExperimentStore } from "../store/useExperimentStore";

interface AppHeaderProps {
  onSearchSelect: (agentId: string) => void;
}

export function AppHeader({ onSearchSelect }: AppHeaderProps) {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const colorBy = useUIStore((s) => s.colorBy);
  const setColorBy = useUIStore((s) => s.setColorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);
  const setSizeBy = useUIStore((s) => s.setSizeBy);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const setSelectedTrait = useUIStore((s) => s.setSelectedTrait);
  const traitKeys = useGraphStore((s) => s.traitKeys);
  const nodes = useGraphStore((s) => s.nodes);
  const exploreMode = useUIStore((s) => s.exploreMode);
  const setExploreMode = useUIStore((s) => s.setExploreMode);
  const experiments = useExperimentStore((s) => s.experiments);
  const addExperiment = useExperimentStore((s) => s.addExperiment);
  const setExperimentPanelOpen = useExperimentStore((s) => s.setExperimentPanelOpen);
  const societyViewOpen = useUIStore((s) => s.societyViewOpen);
  const setSocietyViewOpen = useUIStore((s) => s.setSocietyViewOpen);
  const graphViewMode = useUIStore((s) => s.graphViewMode);
  const setGraphViewMode = useUIStore((s) => s.setGraphViewMode);
  const setHeaderCollapsed = useUIStore((s) => s.setHeaderCollapsed);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = (e.currentTarget.value || "").trim().toLowerCase();
      const found = nodes.find(
        (n) =>
          String(n.agent_id).toLowerCase() === q ||
          String(n.agent_id).toLowerCase().includes(q)
      );
      if (found) {
        setSearchQuery(String(found.agent_id));
        onSearchSelect(String(found.agent_id));
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const found = nodes.find(
      (n) =>
        String(n.agent_id).toLowerCase() === q ||
        String(n.agent_id).toLowerCase().includes(q)
    );
    if (found) onSearchSelect(String(found.agent_id));
  };

  const toggleGroupBase =
    "rounded px-2 py-1 text-xs font-medium transition-all duration-150";
  const toggleActive = "aurora-gradient text-aurora-bg0 shadow-sm";
  const toggleInactive =
    "text-aurora-text1/90 bg-aurora-surface0/50 border border-transparent hover:bg-aurora-surface2/80 hover:text-aurora-text0 hover:border-aurora-border/50";

  return (
    <header className="top-bar group sticky top-0 z-20 flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-aurora-border/60 bg-aurora-bg1/90 px-4 py-2 backdrop-blur-sm sm:gap-3 md:gap-5 md:px-5">
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <h1 className="text-sm font-semibold tracking-tight text-aurora-text0 sm:text-base">
          Society Explorer
        </h1>
        <button
          type="button"
          onClick={() => setHeaderCollapsed(true)}
          className="rounded p-1.5 text-aurora-text2 hover:bg-aurora-surface2/80 hover:text-aurora-text0"
          aria-label="Collapse menu"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="relative min-w-[120px] flex-1 max-w-sm basis-28 sm:basis-40">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-aurora-text2 sm:left-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search agent..."
          className="w-full rounded-lg border border-aurora-border/70 bg-aurora-surface0/80 py-1.5 pl-7 pr-2.5 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/50 sm:rounded-lg sm:pl-8 sm:pr-3"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-5 opacity-85 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-[10px] uppercase tracking-wider text-aurora-text2/80 sm:inline">Color</span>
          <div className="flex rounded-md bg-aurora-surface0/40 p-0.5">
            {(["age", "trait", "centrality"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setColorBy(opt)}
                className={`${toggleGroupBase} capitalize ${
                  colorBy === opt ? toggleActive : toggleInactive
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {colorBy === "trait" && (
            <Listbox value={selectedTrait} onChange={setSelectedTrait} as="div" className="relative">
              <Listbox.Button className="rounded border border-aurora-border/50 bg-aurora-surface0/60 px-2 py-1 text-xs text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/50">
                {selectedTrait || traitKeys[0] || "Trait"}
              </Listbox.Button>
              <Listbox.Options className="absolute right-0 top-full z-20 mt-1 max-h-48 min-w-[120px] overflow-auto rounded-lg border border-aurora-border/70 bg-aurora-surface1 py-1 shadow-card">
                {traitKeys.map((k) => (
                  <Listbox.Option
                    key={k}
                    value={k}
                    className="cursor-pointer px-3 py-1.5 text-xs text-aurora-text0 hover:bg-aurora-surface2"
                  >
                    {k}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-wider text-aurora-text2/80 sm:inline">View</span>
          <div className="flex rounded-md bg-aurora-surface0/40 p-0.5">
            {(["2d", "3d"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGraphViewMode(mode)}
                className={`${toggleGroupBase} uppercase ${
                  graphViewMode === mode ? toggleActive : toggleInactive
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-wider text-aurora-text2/80 sm:inline">Size</span>
          <div className="flex rounded-md bg-aurora-surface0/40 p-0.5">
            {(["degree", "centrality", "level_of_care"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSizeBy(opt)}
                className={`${toggleGroupBase} capitalize ${
                  sizeBy === opt ? toggleActive : toggleInactive
                }`}
              >
                {opt === "level_of_care" ? "Level of care" : opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-wider text-aurora-text2/80 sm:inline">Explore</span>
          <div className="flex rounded-md bg-aurora-surface0/40 p-0.5">
            {(["none", "path", "neighborhood"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setExploreMode(mode)}
                className={`${toggleGroupBase} ${
                  exploreMode === mode ? toggleActive : toggleInactive
                }`}
              >
                {mode === "none" ? "None" : mode === "path" ? "Path" : "Neighborhood"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSocietyViewOpen(!societyViewOpen)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
              societyViewOpen
                ? "bg-aurora-surface2/80 text-aurora-text0"
                : "text-aurora-text1/90 hover:bg-aurora-surface2/60 hover:text-aurora-text0"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Society</span>
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-2 sm:pl-4">
        <Link
          to="/run"
          className="flex items-center gap-1.5 rounded-lg border border-aurora-accent1/60 bg-aurora-surface0/60 px-3 py-1.5 text-sm font-medium text-aurora-accent1 transition-all hover:bg-aurora-surface2/80 hover:text-aurora-accent0 active:scale-[0.98] sm:rounded-xl sm:px-4 sm:py-2"
        >
          <Play className="h-4 w-4" />
          <span className="hidden sm:inline">Run simulation</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            addExperiment({
              name: `Experiment ${experiments.length + 1}`,
              interventionType: "message",
              content: {},
              targetMode: "all",
              targetParams: {},
              intensity: 0.5,
            });
            setExperimentPanelOpen(true);
          }}
          className="aurora-gradient flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm transition-all hover:opacity-95 hover:shadow-aurora-glow active:scale-[0.98] sm:rounded-xl sm:px-4 sm:py-2"
        >
          <FlaskConical className="h-4 w-4" />
          <span className="hidden sm:inline">New Experiment</span>
        </button>
      </div>
    </header>
  );
}

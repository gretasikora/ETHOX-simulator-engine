import { Listbox } from "@headlessui/react";
import { Search, LayoutGrid, FlaskConical } from "lucide-react";
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
    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150";
  const toggleActive = "aurora-gradient text-aurora-bg0 shadow-sm";
  const toggleInactive = "text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0";

  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-aurora-border bg-aurora-bg1/95 px-4 py-3 backdrop-blur-sm sm:gap-4 md:gap-6 md:px-6">
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-aurora-text0 sm:text-base">
          Society Explorer
        </h1>
      </div>

      <div className="relative min-w-[140px] flex-1 max-w-md basis-32 sm:basis-48">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-aurora-text2 sm:left-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search agent..."
          className="w-full rounded-lg border border-aurora-border bg-aurora-surface0 py-1.5 pl-8 pr-3 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:outline-none focus:ring-1 focus:ring-aurora-accent1 focus:shadow-aurora-glow-sm sm:rounded-xl sm:py-2 sm:pl-10 sm:pr-4"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="hidden h-4 w-px bg-aurora-border sm:block" aria-hidden />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden text-xs text-aurora-text2 sm:inline">Color</span>
          <div className="flex rounded-md border border-aurora-border bg-aurora-surface0 p-0.5 sm:rounded-lg">
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
              <Listbox.Button className="rounded-md border border-aurora-border bg-aurora-surface0 px-2 py-1.5 text-xs text-aurora-text0 focus:outline-none focus:ring-1 focus:ring-aurora-accent1 sm:rounded-lg sm:px-2.5">
                {selectedTrait || traitKeys[0] || "Trait"}
              </Listbox.Button>
              <Listbox.Options className="absolute right-0 top-full z-20 mt-1 max-h-48 min-w-[120px] overflow-auto rounded-lg border border-aurora-border bg-aurora-surface1 py-1 shadow-card">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden text-xs text-aurora-text2 sm:inline">View</span>
          <div className="flex rounded-md border border-aurora-border bg-aurora-surface0 p-0.5 sm:rounded-lg">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden text-xs text-aurora-text2 sm:inline">Size</span>
          <div className="flex rounded-md border border-aurora-border bg-aurora-surface0 p-0.5 sm:rounded-lg">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden text-xs text-aurora-text2 sm:inline">Explore</span>
          <div className="flex rounded-md border border-aurora-border bg-aurora-surface0 p-0.5 sm:rounded-lg">
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

        <div className="hidden h-4 w-px bg-aurora-border sm:block" aria-hidden />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSocietyViewOpen(!societyViewOpen)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-all sm:gap-1.5 sm:px-3 sm:py-2 ${
              societyViewOpen
                ? "bg-aurora-surface2 text-aurora-text0"
                : "text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Society</span>
          </button>
        </div>

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
          className="aurora-gradient flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm transition-all hover:opacity-95 hover:shadow-aurora-glow active:scale-[0.98] sm:rounded-xl sm:px-4 sm:py-2"
        >
          <FlaskConical className="h-4 w-4" />
          <span className="hidden sm:inline">New Experiment</span>
        </button>
      </div>
    </header>
  );
}

import { Link } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import { LayoutGrid, FlaskConical, ChevronUp, Pencil, Play, RotateCcw } from "lucide-react";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { useSimulationStore } from "../store/useSimulationStore";
import { useExperimentStore } from "../store/useExperimentStore";

interface AppHeaderProps {
  onSearchSelect: (agentId: string) => void;
}

export function AppHeader({ onSearchSelect: _onSearchSelect }: AppHeaderProps) {
  const colorBy = useUIStore((s) => s.colorBy);
  const setColorBy = useUIStore((s) => s.setColorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);
  const setSizeBy = useUIStore((s) => s.setSizeBy);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const setSelectedTrait = useUIStore((s) => s.setSelectedTrait);
  const traitKeys = useGraphStore((s) => s.traitKeys);
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
  const simulationInput = useSimulationStore((s) => s.simulationInput);
  const initialGraph = useSimulationStore((s) => s.initialGraph);
  const viewMode = useSimulationStore((s) => s.viewMode);
  const status = useSimulationStore((s) => s.status);
  const runSimulation = useSimulationStore((s) => s.runSimulation);
  const revertToDefault = useSimulationStore((s) => s.revertToDefault);
  const applySimulationGraph = useSimulationStore((s) => s.applySimulationGraph);

  const toggleGroupBase =
    "rounded px-2 py-1 text-xs font-medium transition-all duration-150";
  const toggleActive = "aurora-gradient text-aurora-bg0 shadow-sm";
  const toggleInactive =
    "text-aurora-text1/90 bg-aurora-surface0/50 border border-transparent hover:bg-aurora-surface2/80 hover:text-aurora-text0 hover:border-aurora-border/50";

  return (
    <header className="top-bar group sticky top-0 z-20 flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-aurora-border/60 bg-aurora-bg1/90 px-4 py-2 backdrop-blur-sm sm:gap-3 md:gap-5 md:px-5">
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setHeaderCollapsed(true)}
          className="rounded p-1.5 text-aurora-text2 hover:bg-aurora-surface2/80 hover:text-aurora-text0"
          aria-label="Collapse menu"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-5 opacity-85 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-[10px] uppercase tracking-wider text-aurora-text2/80 sm:inline">Color</span>
          <div className="flex rounded-md bg-aurora-surface0/40 p-0.5">
            {(["age", "trait"] as const).map((opt) => (
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
            {(["degree", "level_of_care"] as const).map((opt) => (
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
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Change simulation</span>
        </Link>
        {simulationInput.trigger && (
          <button
            type="button"
            onClick={() => runSimulation(simulationInput.trigger, simulationInput.numAgents)}
            disabled={status === "loading_initial"}
            className="aurora-gradient flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm transition-all hover:opacity-95 hover:shadow-aurora-glow active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed sm:rounded-xl sm:px-4 sm:py-2"
          >
            {status === "loading_initial" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-aurora-bg0/30 border-t-aurora-bg0" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Run</span>
          </button>
        )}
        {initialGraph && (
          viewMode === "simulation" ? (
            <button
              type="button"
              onClick={() => revertToDefault()}
              className="flex items-center gap-1.5 rounded-lg border border-aurora-border/70 bg-aurora-surface0/60 px-3 py-1.5 text-sm font-medium text-aurora-text1 transition-all hover:bg-aurora-surface2/80 hover:text-aurora-text0 active:scale-[0.98] sm:rounded-xl sm:px-4 sm:py-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Revert</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => applySimulationGraph()}
              className="flex items-center gap-1.5 rounded-lg border border-aurora-accent1/60 bg-aurora-surface0/60 px-3 py-1.5 text-sm font-medium text-aurora-accent1 transition-all hover:bg-aurora-surface2/80 hover:text-aurora-accent0 active:scale-[0.98] sm:rounded-xl sm:px-4 sm:py-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Re-run</span>
            </button>
          )
        )}
        {false && (
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
        )}
      </div>
    </header>
  );
}

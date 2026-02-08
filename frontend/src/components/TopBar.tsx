import { Listbox } from "@headlessui/react";
import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { useExperimentStore } from "../store/useExperimentStore";

interface TopBarProps {
  onSearchSelect: (agentId: string) => void;
}

export function TopBar({ onSearchSelect }: TopBarProps) {
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

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-dark-700 bg-dark-800 px-4">
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search agent..."
          className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Color by</span>
        <div className="flex rounded-lg border border-dark-700 p-0.5">
          {(["age", "trait"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setColorBy(opt)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                colorBy === opt
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:bg-dark-700 hover:text-gray-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {colorBy === "trait" && (
          <Listbox value={selectedTrait} onChange={setSelectedTrait} as="div" className="relative">
            <Listbox.Button className="rounded border border-dark-700 bg-dark-700 px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent">
              {selectedTrait || traitKeys[0] || "Trait"}
            </Listbox.Button>
            <Listbox.Options className="absolute right-0 top-full z-20 mt-1 max-h-48 min-w-[120px] overflow-auto rounded border border-dark-700 bg-dark-800 py-1">
              {traitKeys.map((k) => (
                <Listbox.Option key={k} value={k} className="cursor-pointer px-3 py-1.5 text-xs text-gray-200 hover:bg-dark-700">
                  {k}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Size by</span>
        <div className="flex rounded-lg border border-dark-700 p-0.5">
          {(["degree", "level_of_care"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSizeBy(opt)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                sizeBy === opt
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:bg-dark-700 hover:text-gray-200"
              }`}
            >
              {opt === "level_of_care" ? "Level of care" : opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-dark-700 p-0.5">
        <span className="px-2 text-xs text-gray-500">Explore</span>
        {(["none", "path", "neighborhood"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setExploreMode(mode)}
            className={`rounded px-2 py-1.5 text-xs font-medium capitalize ${
              exploreMode === mode
                ? "bg-accent text-white"
                : "text-gray-400 hover:bg-dark-700 hover:text-gray-200"
            }`}
          >
            {mode === "none" ? "None" : mode === "path" ? "Path" : "Neighborhood"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSocietyViewOpen(!societyViewOpen)}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          societyViewOpen
            ? "border-accent bg-accent text-white"
            : "border-dark-700 bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white"
        }`}
      >
        Society
      </button>

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
        className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20"
      >
        New Experiment
      </button>
    </header>
  );
}

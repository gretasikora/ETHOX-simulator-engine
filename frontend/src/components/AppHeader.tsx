import { Link } from "react-router-dom";
import { useUIStore } from "../store/useUIStore";

interface AppHeaderProps {
  onSearchSelect: (agentId: string) => void;
}

export function AppHeader({ onSearchSelect: _onSearchSelect }: AppHeaderProps) {
  const graphViewMode = useUIStore((s) => s.graphViewMode);
  const setGraphViewMode = useUIStore((s) => s.setGraphViewMode);

  const toggleGroupBase =
    "rounded px-2 py-1 text-xs font-medium transition-all duration-150";
  const toggleActive = "aurora-gradient text-aurora-bg0 shadow-sm";
  const toggleInactive =
    "text-aurora-text1/90 bg-aurora-surface0/50 border border-transparent hover:bg-aurora-surface2/80 hover:text-aurora-text0 hover:border-aurora-border/50";

  return (
    <header className="top-bar group sticky top-0 z-20 flex min-h-12 w-full shrink-0 items-center gap-2 border-b border-aurora-border/60 bg-aurora-bg1/90 px-4 py-2 backdrop-blur-sm sm:gap-3 md:gap-5 md:px-5">
      <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
        <img src="/logo-no-bg (1).png" alt="" className="h-8 w-8 object-contain" aria-hidden />
        <img src="/epistemea.png" alt="EPISTEMEA" className="h-5 w-auto object-contain sm:h-6" />
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:gap-5">
        {/* Explanation text */}
        <div className="flex items-center gap-3 text-xs text-aurora-text2">
          <span>Color: Age</span>
          <span className="text-aurora-border">|</span>
          <span>Size: Degree</span>
        </div>

        {/* View toggle */}
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
      </div>
    </header>
  );
}

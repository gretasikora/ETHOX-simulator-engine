import { useSimulationStore } from "../store/useSimulationStore";
import { FileText } from "lucide-react";

export function SimulationCompleteToast() {
  const status = useSimulationStore((s) => s.status);
  const openReportModal = useSimulationStore((s) => s.openReportModal);

  if (status !== "finished") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="surface-elevated flex items-center gap-4 rounded-xl border border-aurora-border/60 px-4 py-3 shadow-aurora-glow-sm">
        <span className="text-sm font-medium text-aurora-text0">Simulation complete</span>
        <button
          type="button"
          onClick={openReportModal}
          className="flex items-center gap-2 rounded-lg bg-aurora-accent1/20 px-3 py-1.5 text-sm font-medium text-aurora-accent1 transition-colors hover:bg-aurora-accent1/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-accent1"
        >
          <FileText className="h-4 w-4" />
          View report
        </button>
      </div>
    </div>
  );
}

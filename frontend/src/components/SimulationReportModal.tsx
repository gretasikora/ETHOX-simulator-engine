import { useEffect, useCallback, useState } from "react";
import { useSimulationStore } from "../store/useSimulationStore";
import { useUIStore } from "../store/useUIStore";
import { copyTextToClipboard } from "../utils/clipboard";
import { ReportContentFormatter } from "./ReportContentFormatter";
import { X, Copy, RefreshCw, FileDown, ChevronDown, ChevronUp } from "lucide-react";

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function truncateTrigger(trigger: string, maxLen: number): string {
  if (trigger.length <= maxLen) return trigger;
  return trigger.slice(0, maxLen) + "…";
}

export function SimulationReportModal() {
  const reportModalOpen = useSimulationStore((s) => s.reportModalOpen);
  const reportStatus = useSimulationStore((s) => s.reportStatus);
  const reportError = useSimulationStore((s) => s.reportError);
  const reportCareScore100 = useSimulationStore((s) => s.reportCareScore100);
  const reportUsageEffect50 = useSimulationStore((s) => s.reportUsageEffect50);
  const reportText = useSimulationStore((s) => s.reportText);
  const reportIncludeInitial = useSimulationStore((s) => s.reportIncludeInitial);
  const reportGeneratedAt = useSimulationStore((s) => s.reportGeneratedAt);

  const simulationId = useSimulationStore((s) => s.simulationId);
  const simulationInput = useSimulationStore((s) => s.simulationInput);

  const fetchReport = useSimulationStore((s) => s.fetchReport);
  const closeReportModal = useSimulationStore((s) => s.closeReportModal);
  const setReportIncludeInitial = useSimulationStore((s) => s.setReportIncludeInitial);

  const [triggerExpanded, setTriggerExpanded] = useState(false);

  const handleFetch = useCallback(() => {
    if (simulationId && simulationInput.trigger) {
      fetchReport(simulationId, simulationInput.trigger, reportIncludeInitial);
    }
  }, [simulationId, simulationInput.trigger, reportIncludeInitial, fetchReport]);

  useEffect(() => {
    if (reportModalOpen && simulationId && simulationInput.trigger && reportStatus === "idle") {
      handleFetch();
    }
  }, [reportModalOpen, simulationId, simulationInput.trigger, reportStatus, handleFetch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReportModal();
    },
    [closeReportModal]
  );

  useEffect(() => {
    if (reportModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [reportModalOpen, handleKeyDown]);

  const addToast = useUIStore((s) => s.addToast);

  const handleCopy = async () => {
    if (reportText && (await copyTextToClipboard(reportText))) {
      addToast("Report copied to clipboard", "success");
    }
  };

  if (!reportModalOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={closeReportModal}
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 flex h-[min(86vh,900px)] w-[min(1024px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-aurora-border bg-aurora-bg1 shadow-aurora-glow"
        role="dialog"
        aria-labelledby="report-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A) Header - fixed */}
        <header className="flex shrink-0 flex-col border-b border-aurora-border bg-aurora-bg1 px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="report-modal-title" className="text-xl font-semibold text-aurora-text0">
                Simulation Report
              </h2>
              <p className="mt-0.5 text-sm text-aurora-text2">Voter Reaction Summary</p>
            </div>
            <button
              type="button"
              onClick={closeReportModal}
              className="rounded-lg p-2 text-aurora-text2 hover:bg-aurora-surface2 hover:text-aurora-text0 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-accent1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* B) Scrollable content - single scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {reportStatus === "loading" && (
            <div className="flex flex-col gap-6 p-8">
              <div className="flex gap-8">
                <div className="h-24 flex-1 animate-pulse rounded-lg bg-aurora-surface2" />
                <div className="h-24 flex-1 animate-pulse rounded-lg bg-aurora-surface2" />
              </div>
              <div className="h-48 animate-pulse rounded-lg bg-aurora-surface2" />
              <div className="h-32 animate-pulse rounded-lg bg-aurora-surface2" />
            </div>
          )}

          {reportStatus === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <p className="text-center text-aurora-text1">
                {reportError || "Could not generate report. Try again."}
              </p>
              <button
                type="button"
                onClick={handleFetch}
                className="flex items-center gap-2 rounded-lg bg-aurora-accent1/20 px-4 py-2.5 text-sm font-medium text-aurora-accent1 hover:bg-aurora-accent1/30"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {reportStatus === "ready" && (
            <div className="p-8">
              {/* Report page surface - paper-like */}
              <div className="rounded-lg border border-aurora-border/60 bg-aurora-surface0/60 shadow-lg">
                <div className="p-10 md:p-12">
                  {/* 1. Executive Summary */}
                  <section className="mb-10">
                    <h3 className="mb-6 border-b border-aurora-border/60 pb-2 text-sm font-semibold uppercase tracking-wider text-aurora-text2">
                      Executive Summary
                    </h3>
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-aurora-text2">
                          Care score
                        </p>
                        <p className="mt-1 text-3xl font-semibold text-aurora-text0">
                          {reportCareScore100 ?? 0}
                          <span className="ml-1 text-lg font-normal text-aurora-text2">/ 100</span>
                        </p>
                        <p className="mt-0.5 text-xs text-aurora-text2">
                          Average engagement with the event
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-aurora-text2">
                          Change in Support
                        </p>
                        <p className="mt-1 text-3xl font-semibold text-aurora-text0">
                          {reportUsageEffect50 ?? 0}
                          <span className="ml-1 text-sm font-normal text-aurora-text2">
                            (range −50 to +50)
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-aurora-text2">
                          Predicted impact on voter support
                        </p>
                      </div>
                    </div>

                    {/* Metadata grid */}
                    <div className="mt-8 space-y-4">
                      <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium text-aurora-text2">Agents</p>
                          <p className="mt-0.5 text-aurora-text1">
                            {simulationInput.numAgents ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-aurora-text2">Generated</p>
                          <p className="mt-0.5 text-aurora-text1">
                            {reportGeneratedAt ? formatTimestamp(reportGeneratedAt) : "—"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-aurora-text2">Trigger</p>
                        <p className="mt-0.5 text-aurora-text1">
                          {triggerExpanded || (simulationInput.trigger?.length ?? 0) <= 120
                            ? simulationInput.trigger ?? "—"
                            : truncateTrigger(simulationInput.trigger ?? "", 120)}
                          {(simulationInput.trigger?.length ?? 0) > 120 && (
                            <button
                              type="button"
                              onClick={() => setTriggerExpanded((e) => !e)}
                              className="ml-1 inline-flex items-center text-aurora-accent1 hover:underline"
                            >
                              {triggerExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Include initial - subtle */}
                    <div className="mt-6 flex items-center gap-2 border-t border-aurora-border/40 pt-4">
                      <input
                        type="checkbox"
                        id="include-initial"
                        checked={reportIncludeInitial}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setReportIncludeInitial(checked);
                          if (simulationId && simulationInput.trigger) {
                            fetchReport(simulationId, simulationInput.trigger, checked);
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-aurora-border bg-aurora-surface1 text-aurora-accent1 focus:ring-aurora-accent1"
                      />
                      <label
                        htmlFor="include-initial"
                        className="text-xs text-aurora-text2"
                      >
                        Include initial vs final
                      </label>
                    </div>
                  </section>

                  {/* Divider */}
                  <div className="my-10 border-t border-aurora-border/60" />

                  {/* 2. Full Report - document flow */}
                  <section>
                    <h3 className="mb-6 border-b border-aurora-border/60 pb-2 text-sm font-semibold uppercase tracking-wider text-aurora-text2">
                      Full Report
                    </h3>
                    <div className="max-w-prose">
                      {reportText ? (
                        <ReportContentFormatter text={reportText} />
                      ) : (
                        <p className="text-aurora-text2">No report content.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* C) Sticky footer actions */}
        {reportStatus === "ready" && (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-aurora-border bg-aurora-bg1 px-8 py-4">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-aurora-border bg-aurora-surface0 px-4 py-2 text-sm font-medium text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0"
            >
              <Copy className="h-4 w-4" />
              Copy report
            </button>
            <span title="Coming soon" className="inline-block">
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-aurora-border/50 bg-aurora-surface0/50 px-4 py-2 text-sm font-medium text-aurora-text2 opacity-60"
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </button>
            </span>
            <button
              type="button"
              onClick={closeReportModal}
              className="aurora-gradient rounded-lg px-4 py-2 text-sm font-medium text-aurora-bg0"
            >
              Close
            </button>
          </footer>
        )}
      </div>
    </>
  );
}

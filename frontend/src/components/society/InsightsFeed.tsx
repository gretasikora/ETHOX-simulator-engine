import { useState } from "react";
import type { Insight } from "../../utils/insightRules";
import { formatInsightsForClipboard } from "../../utils/insightRules";
import { copyTextToClipboard } from "../../utils/clipboard";
import { useUIStore } from "../../store/useUIStore";

interface InsightsFeedProps {
  insights: Insight[];
  onRecompute: () => void;
}

const SEVERITY_STYLES: Record<Insight["severity"], string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  watch: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  risk: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function InsightsFeed({ insights, onRecompute }: InsightsFeedProps) {
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const handleCopy = async () => {
    const text = formatInsightsForClipboard(insights);
    const ok = await copyTextToClipboard(text);
    if (ok) addToast("Summary copied to clipboard", "success");
    else addToast("Failed to copy", "error");
  };

  return (
    <div className="flex flex-col rounded-lg border border-dark-600 bg-dark-800">
      <div className="flex items-center justify-between border-b border-dark-600 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Insights Feed</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRecompute}
            className="rounded border border-dark-600 px-2 py-1.5 text-xs text-gray-300 hover:bg-dark-700"
          >
            Recompute
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded border border-dark-600 px-2 py-1.5 text-xs text-gray-300 hover:bg-dark-700"
          >
            Copy summary
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {insights.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No insights yet. Load a graph and recompute.</p>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="relative rounded-lg border border-dark-600 bg-dark-700/50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[insight.severity]}`}
                      >
                        {insight.severity}
                      </span>
                      <span className="font-medium text-white">{insight.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{insight.body}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded p-1 text-gray-500 hover:bg-dark-600 hover:text-gray-300"
                    title="Why?"
                    onMouseEnter={() => setTooltipId(insight.id)}
                    onMouseLeave={() => setTooltipId(null)}
                  >
                    ?
                  </button>
                </div>
                {tooltipId === insight.id && insight.metricValues && (
                  <div
                    className="absolute right-2 top-10 z-10 max-w-xs rounded border border-dark-600 bg-dark-800 px-3 py-2 text-xs text-gray-400 shadow-lg"
                    onMouseEnter={() => setTooltipId(insight.id)}
                    onMouseLeave={() => setTooltipId(null)}
                  >
                    <p className="font-medium text-gray-300">Metrics used:</p>
                    <ul className="mt-1 list-inside list-disc">
                      {Object.entries(insight.metricValues).map(([k, v]) => (
                        <li key={k}>
                          {k}: {String(v)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

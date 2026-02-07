import { useEffect, useCallback, useMemo } from "react";
import type { NodeData } from "../api/client";
import { formatTraitLabel, sortTraits } from "../utils/traits";
import { useGraphStore } from "../store/useGraphStore";

interface AgentProfileDrawerProps {
  open: boolean;
  selectedNodeId: string | null;
  onOpenChange: (open: boolean) => void;
}

function TraitRow({ label, value }: { label: string; value: number }) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const pct = Math.max(0, Math.min(1, safe)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{formatTraitLabel(label ?? "")}</span>
        <span className="text-gray-200 tabular-nums">{safe.toFixed(2)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-dark-700">
        <div
          className="h-full rounded bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AgentProfileDrawer({
  open,
  selectedNodeId,
  onOpenChange,
}: AgentProfileDrawerProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const agent = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => String(n.agent_id) === String(selectedNodeId)) ?? null;
  }, [selectedNodeId, nodes]);
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/50 transition-opacity"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className="fixed right-0 top-0 z-40 flex h-full w-[min(100%,28rem)] min-w-[320px] flex-col border-l border-dark-700 bg-dark-800 shadow-xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-dark-700 p-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-white">
              Agent {agent?.agent_id ?? selectedNodeId ?? ""}
            </h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Cluster {agent?.cluster ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {!agent ? (
          <div className="flex flex-1 items-center justify-center p-4 text-gray-500">
            No agent selected
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Persona */}
            <section className="mb-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Likely persona
              </h3>
              <p className="text-sm text-gray-200">
                this is where blurb will be
              </p>
            </section>

            {/* Network stats */}
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Network stats
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-dark-700 p-3">
                  <div className="text-xs text-gray-500">Degree</div>
                  <div className="text-lg font-semibold text-white">
                    {agent.degree ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-dark-700 p-3">
                  <div className="text-xs text-gray-500">Degree centrality</div>
                  <div className="text-lg font-semibold text-white tabular-nums">
                    {(agent.degree_centrality ?? 0).toFixed(4)}
                  </div>
                </div>
                <div className="rounded-lg bg-dark-700 p-3">
                  <div className="text-xs text-gray-500">Betweenness centrality</div>
                  <div className="text-lg font-semibold text-white tabular-nums">
                    {(agent.betweenness_centrality ?? 0).toFixed(4)}
                  </div>
                </div>
              </div>
            </section>

            {/* Traits */}
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Traits
              </h3>
              {(() => {
                const sorted = sortTraits(agent.traits ?? {});
                const top6 = sorted.slice(0, 6);
                const bottom3 = sorted.slice(-3);
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-300">
                        Top traits
                      </h4>
                      <div className="space-y-3">
                        {top6.map(({ name, value }) => (
                          <TraitRow key={name} label={name} value={value ?? 0} />
                        ))}
                      </div>
                    </div>
                    {bottom3.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-300">
                          Lowest traits
                        </h4>
                        <div className="space-y-3">
                          {bottom3.map(({ name, value }) => (
                            <TraitRow key={name} label={name} value={value ?? 0} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>
          </div>
        )}
      </div>
    </>
  );
}

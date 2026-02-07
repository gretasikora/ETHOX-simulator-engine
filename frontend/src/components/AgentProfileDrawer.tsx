import { useEffect, useCallback, useMemo } from "react";
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
        <span className="text-aurora-text1">{formatTraitLabel(label ?? "")}</span>
        <span className="text-aurora-text0 tabular-nums">{safe.toFixed(2)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-aurora-surface2">
        <div
          className="aurora-gradient h-full rounded"
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
        className="fixed inset-0 z-30 bg-aurora-bg0/60 transition-opacity"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className="fixed right-0 top-0 z-40 flex h-full w-[min(100%,28rem)] min-w-[320px] flex-col border-l border-aurora-border bg-aurora-bg1 shadow-xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-labelledby="drawer-title"
      >
        <div className="flex items-start justify-between border-b border-aurora-border p-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-aurora-text0">
              Agent {agent?.agent_id ?? selectedNodeId ?? ""}
            </h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-aurora-text1">
              <span>Cluster {agent?.cluster ?? "—"}</span>
              {agent?.age != null && <span>Age {agent.age}</span>}
              {agent?.gender != null && agent.gender !== "" && (
                <span className="capitalize">{agent.gender.replace(/_/g, " ")}</span>
              )}
            </div>
            {(agent?.level_of_care != null || agent?.effect_on_usage != null || (agent?.text_opinion != null && agent.text_opinion !== "")) && (
              <div className="mt-2 space-y-1 border-t border-aurora-border pt-2 text-sm text-aurora-text1">
                {agent?.level_of_care != null && (
                  <div><span className="text-aurora-text2">Level of care:</span> {agent.level_of_care}/10</div>
                )}
                {agent?.effect_on_usage != null && (
                  <div><span className="text-aurora-text2">Effect on usage:</span> {agent.effect_on_usage}</div>
                )}
                {agent?.text_opinion != null && agent.text_opinion !== "" && (
                  <div><span className="text-aurora-text2">Opinion:</span> {agent.text_opinion}</div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-aurora-text1 hover:bg-aurora-surface2 hover:text-aurora-text0 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-accent1"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {!agent ? (
          <div className="flex flex-1 items-center justify-center p-4 text-aurora-text2">
            No agent selected
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <section className="mb-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-aurora-text2">
                Likely persona
              </h3>
              <p className="text-sm text-aurora-text0">
                this is where blurb will be
              </p>
            </section>

            <section className="mb-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
                Network stats
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-aurora-border bg-aurora-surface1 p-3">
                  <div className="text-xs text-aurora-text2">Degree</div>
                  <div className="text-lg font-semibold text-aurora-text0">
                    {agent.degree ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border border-aurora-border bg-aurora-surface1 p-3">
                  <div className="text-xs text-aurora-text2">Degree centrality</div>
                  <div className="text-lg font-semibold text-aurora-text0 tabular-nums">
                    {(agent.degree_centrality ?? 0).toFixed(4)}
                  </div>
                </div>
                <div className="rounded-lg border border-aurora-border bg-aurora-surface1 p-3">
                  <div className="text-xs text-aurora-text2">Betweenness centrality</div>
                  <div className="text-lg font-semibold text-aurora-text0 tabular-nums">
                    {(agent.betweenness_centrality ?? 0).toFixed(4)}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
                Traits
              </h3>
              {(() => {
                const sorted = sortTraits(agent.traits ?? {});
                const top6 = sorted.slice(0, 6);
                const bottom3 = sorted.slice(-3);
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-aurora-text1">
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
                        <h4 className="mb-2 text-sm font-medium text-aurora-text1">
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

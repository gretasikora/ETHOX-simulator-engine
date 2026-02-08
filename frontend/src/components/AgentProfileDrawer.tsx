import { useEffect, useCallback, useMemo } from "react";
import { formatTraitLabel, sortTraits } from "../utils/traits";
import { useGraphStore } from "../store/useGraphStore";
import { usePlaybackStore } from "../store/usePlaybackStore";
import { useUIStore } from "../store/useUIStore";
import { getOpinionColor } from "../utils/color";

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

function formatOpinionLabel(opinion: number): string {
  if (opinion < -0.33) return "Negative";
  if (opinion > 0.33) return "Positive";
  return "Neutral";
}

export function AgentProfileDrawer({
  open,
  selectedNodeId,
  onOpenChange,
}: AgentProfileDrawerProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const playbackRunId = usePlaybackStore((s) => s.activeRunId);
  const playbackRuns = usePlaybackStore((s) => s.runs);

  const agent = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => String(n.agent_id) === String(selectedNodeId)) ?? null;
  }, [selectedNodeId, nodes]);

  const neighbours = useMemo(() => {
    if (!selectedNodeId || !edges.length) return [];
    const id = String(selectedNodeId);
    const out: { agent_id: string; weight: number }[] = [];
    for (const e of edges) {
      const s = String(e.source);
      const t = String(e.target);
      if (s === id) out.push({ agent_id: t, weight: e.weight ?? 1 });
      else if (t === id) out.push({ agent_id: s, weight: e.weight ?? 1 });
    }
    return out.sort((a, b) => b.weight - a.weight);
  }, [selectedNodeId, edges]);

  const run = useMemo(
    () => (playbackRunId ? playbackRuns.find((r) => r.id === playbackRunId) ?? null : null),
    [playbackRunId, playbackRuns]
  );
  const initialOpinion = useMemo(() => {
    if (!run?.frames?.length || !selectedNodeId) return null;
    const frame0 = run.frames[0];
    const state = frame0?.agents?.[String(selectedNodeId)];
    return state?.opinion ?? null;
  }, [run, selectedNodeId]);
  const finalOpinion = useMemo(() => {
    if (!run?.frames?.length || !selectedNodeId) return null;
    const lastFrame = run.frames[run.frames.length - 1];
    const state = lastFrame?.agents?.[String(selectedNodeId)];
    return state?.opinion ?? null;
  }, [run, selectedNodeId]);

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
              {agent?.age != null && <span>Age {agent.age}</span>}
              {agent?.gender != null && agent.gender !== "" && (
                <span className="capitalize">{agent.gender.replace(/_/g, " ")}</span>
              )}
            </div>
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
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
                Initial
              </h3>
              <div className="space-y-3 rounded-lg border border-aurora-border/60 bg-aurora-surface0/40 p-3">
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-aurora-text2/80">
                    Opinion
                  </div>
                  {initialOpinion != null ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: getOpinionColor(initialOpinion) }}
                      />
                      <span className="text-sm font-medium text-aurora-text0 tabular-nums">
                        {initialOpinion.toFixed(2)}
                      </span>
                      <span className="text-sm text-aurora-text1">
                        ({formatOpinionLabel(initialOpinion)})
                      </span>
                    </div>
                  ) : agent?.initial_opinion != null && agent.initial_opinion !== "" ? (
                    <p className="text-sm text-aurora-text0">{agent.initial_opinion}</p>
                  ) : (
                    <p className="text-sm text-aurora-text2">
                      {run ? "—" : "Run a simulation"}
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-aurora-text2/80">
                    Level of care
                  </div>
                  <p className="text-sm text-aurora-text0">
                    {agent?.initial_level_of_care != null
                      ? `${(agent.initial_level_of_care * 10).toFixed(0)}/10`
                      : "—"}
                  </p>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-aurora-text2/80">
                    Effect on usage
                  </div>
                  <p className="text-sm text-aurora-text0">
                    {agent?.initial_effect_on_usage != null
                      ? String(agent.initial_effect_on_usage)
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-aurora-text2">
                Final
              </h3>
              <div className="space-y-3 rounded-lg border border-aurora-border/60 bg-aurora-surface0/40 p-3">
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-aurora-text2/80">
                    Opinion
                  </div>
                  {finalOpinion != null ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: getOpinionColor(finalOpinion) }}
                      />
                      <span className="text-sm font-medium text-aurora-text0 tabular-nums">
                        {finalOpinion.toFixed(2)}
                      </span>
                      <span className="text-sm text-aurora-text1">
                        ({formatOpinionLabel(finalOpinion)})
                      </span>
                    </div>
                  ) : agent?.text_opinion != null && agent.text_opinion !== "" ? (
                    <p className="text-sm text-aurora-text0">{agent.text_opinion}</p>
                  ) : (
                    <p className="text-sm text-aurora-text2">
                      {run ? "—" : "Run a simulation"}
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-aurora-text2/80">
                    Level of care
                  </div>
                  <p className="text-sm text-aurora-text0">
                    {agent?.level_of_care != null
                      ? `${(agent.level_of_care * 10).toFixed(0)}/10`
                      : "—"}
                  </p>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-aurora-text2/80">
                    Effect on usage
                  </div>
                  <p className="text-sm text-aurora-text0">
                    {agent?.effect_on_usage != null ? String(agent.effect_on_usage) : "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-aurora-text2">
                Neighbours ({neighbours.length})
              </h3>
              {neighbours.length === 0 ? (
                <p className="text-sm text-aurora-text2">No connections</p>
              ) : (
                <ul className="space-y-1">
                  {neighbours.map(({ agent_id, weight }) => (
                    <li key={agent_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedNode(agent_id)}
                        className="flex w-full items-center justify-between rounded-lg border border-aurora-border/60 bg-aurora-surface0/60 px-3 py-2 text-left text-sm text-aurora-text0 transition-colors hover:bg-aurora-surface2/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-accent1"
                      >
                        <span>Agent {agent_id}</span>
                        <span className="text-xs text-aurora-text2 tabular-nums">
                          weight {weight.toFixed(2)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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

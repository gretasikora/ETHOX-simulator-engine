import { create } from "zustand";
import type { Experiment } from "../types/experiment";
import {
  loadExperimentsFromStorage,
  saveExperimentsToStorage,
  computeTargets,
} from "../utils/experimentTargeting";
import type { NodeData, EdgeData } from "../api/client";

interface ExperimentState {
  experiments: Experiment[];
  activeExperimentId: string | null;
  appliedTargetIds: string[];
  manualTargetIds: string[];
  experimentPanelOpen: boolean;
  setExperimentPanelOpen: (open: boolean) => void;
  setActiveExperimentId: (id: string | null) => void;
  setManualTargetIds: (ids: string[]) => void;
  toggleManualTarget: (id: string) => void;
  addExperiment: (exp: Omit<Experiment, "id" | "createdAt">) => Experiment;
  updateExperiment: (id: string, patch: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  loadExperiment: (id: string) => Experiment | undefined;
  applyToGraph: (experimentId: string, nodes: NodeData[], edges: EdgeData[]) => string[];
  clearFromGraph: () => void;
  getAppliedTargetIds: () => string[];
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  experiments: loadExperimentsFromStorage(),
  activeExperimentId: null,
  appliedTargetIds: [],
  manualTargetIds: [],
  experimentPanelOpen: false,

  setExperimentPanelOpen: (open) => set({ experimentPanelOpen: open }),
  setActiveExperimentId: (id) => set({ activeExperimentId: id }),
  setManualTargetIds: (ids) => set({ manualTargetIds: ids }),

  toggleManualTarget: (id) => {
    const current = get().manualTargetIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    set({ manualTargetIds: next });
  },

  addExperiment: (exp) => {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const full: Experiment = {
      ...exp,
      id,
      createdAt: new Date().toISOString(),
      targetParams: exp.targetParams ?? {},
      content: exp.content ?? {},
    };
    set((s) => {
      const next = [...s.experiments, full];
      saveExperimentsToStorage(next);
      return { experiments: next, activeExperimentId: id };
    });
    return full;
  },

  updateExperiment: (id, patch) => {
    set((s) => {
      const next = s.experiments.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      );
      saveExperimentsToStorage(next);
      return { experiments: next };
    });
  },

  deleteExperiment: (id) => {
    set((s) => {
      const next = s.experiments.filter((e) => e.id !== id);
      saveExperimentsToStorage(next);
      return {
        experiments: next,
        activeExperimentId: s.activeExperimentId === id ? null : s.activeExperimentId,
        appliedTargetIds: s.appliedTargetIds.length && s.activeExperimentId === id ? [] : s.appliedTargetIds,
      };
    });
  },

  loadExperiment: (id) => {
    const exp = get().experiments.find((e) => e.id === id);
    if (exp) set({ activeExperimentId: id });
    return exp;
  },

  applyToGraph: (experimentId, nodes, edges) => {
    const exp = get().experiments.find((e) => e.id === experimentId);
    if (!exp) return [];
    const withManual =
      exp.targetMode === "manual"
        ? { ...exp, targetParams: { ...exp.targetParams, manualIds: get().manualTargetIds } }
        : exp;
    const ids = computeTargets(withManual, nodes, edges);
    set({
      appliedTargetIds: ids,
      activeExperimentId: experimentId,
    });
    set((s) => {
      const updated = s.experiments.map((e) =>
        e.id === experimentId ? { ...e, computedTargets: ids } : e
      );
      saveExperimentsToStorage(updated);
      return { experiments: updated };
    });
    return ids;
  },

  clearFromGraph: () => set({ appliedTargetIds: [] }),

  getAppliedTargetIds: () => get().appliedTargetIds,
}));

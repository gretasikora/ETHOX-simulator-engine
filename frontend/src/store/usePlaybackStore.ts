import { create } from "zustand";
import type { PlaybackRun, AgentFrameState } from "../types/playback";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

export type PlaybackColorMode = "opinion";

interface PlaybackState {
  runs: PlaybackRun[];
  activeRunId: string | null;
  t: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  colorMode: PlaybackColorMode;

  setActiveRunId: (id: string | null) => void;
  setT: (t: number) => void;
  setPlaying: (v: boolean) => void;
  setSpeed: (v: PlaybackSpeed) => void;
  setColorMode: (v: PlaybackColorMode) => void;

  addRun: (run: PlaybackRun) => void;
  removeRun: (id: string) => void;
  clearRuns: () => void;

  /** Current frame's agent states (derived helper); null when no active run or t out of range */
  getCurrentAgentState: () => Record<string, AgentFrameState> | null;
  /** Targeted agent ids for the active run (from meta or empty) */
  getTargetedAgentIds: () => string[];
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  runs: [],
  activeRunId: null,
  t: 0,
  isPlaying: false,
  speed: 1,
  colorMode: "opinion",

  setActiveRunId: (id) => {
    set({ activeRunId: id, t: 0, isPlaying: false });
  },

  setT: (t) => {
    const { activeRunId, runs } = get();
    const run = activeRunId ? runs.find((r) => r.id === activeRunId) : null;
    const maxT = run && run.frames.length > 0 ? run.frames.length - 1 : 0;
    set({ t: Math.max(0, Math.min(maxT, Math.round(t))) });
  },

  setPlaying: (v) => set({ isPlaying: v }),
  setSpeed: (v) => set({ speed: v }),
  setColorMode: (v) => set({ colorMode: v }),

  addRun: (run) => {
    set((s) => ({
      runs: [run, ...s.runs],
      activeRunId: run.id,
      t: 0,
      isPlaying: false,
    }));
  },

  removeRun: (id) => {
    set((s) => ({
      runs: s.runs.filter((r) => r.id !== id),
      activeRunId: s.activeRunId === id ? null : s.activeRunId,
      t: s.activeRunId === id ? 0 : s.t,
      isPlaying: s.activeRunId === id ? false : s.isPlaying,
    }));
  },

  clearRuns: () => {
    set({ runs: [], activeRunId: null, t: 0, isPlaying: false });
  },

  getCurrentAgentState: () => {
    const { activeRunId, runs, t } = get();
    const run = activeRunId ? runs.find((r) => r.id === activeRunId) : null;
    if (!run || !run.frames.length) return null;
    const frame = run.frames[Math.min(t, run.frames.length - 1)];
    return frame?.agents ?? null;
  },

  getTargetedAgentIds: () => {
    const { activeRunId, runs } = get();
    const run = activeRunId ? runs.find((r) => r.id === activeRunId) : null;
    const ids = run?.meta?.targetedAgentIds;
    if (!ids) return [];
    return ids.map((id) => String(id));
  },
}));

export { SPEED_OPTIONS };

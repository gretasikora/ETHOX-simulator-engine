import type { NodeData, EdgeData } from "../api/client";
import type { PlaybackRun, Frame, AgentFrameState } from "../types/playback";
import { buildAdjacency } from "./graphAlgorithms";

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export interface GenerateDemoRunOptions {
  nodes: NodeData[];
  edges: EdgeData[];
  timesteps?: number;
  targetedAgentIds?: string[];
  seed?: number;
  name?: string;
}

export function generateDemoRun(options: GenerateDemoRunOptions): PlaybackRun {
  const {
    nodes,
    edges,
    timesteps = 30,
    targetedAgentIds = [],
    seed = 42,
    name = "Demo run",
  } = options;

  const rng = seededRandom(seed);
  const adj = buildAdjacency(edges);

  const targetedSet = new Set(targetedAgentIds.map((id) => String(id)));
  const clusterBias = new Map<number, number>();
  for (const n of nodes) {
    const c = n.cluster;
    if (!clusterBias.has(c)) {
      clusterBias.set(c, (rng() - 0.5) * 0.15);
    }
  }

  const initialOpinion = (id: string): number => {
    const node = nodes.find((n) => String(n.agent_id) === id);
    if (!node) return 0;
    const base = (rng() - 0.5) * 0.4;
    const bias = clusterBias.get(node.cluster) ?? 0;
    return clamp(base + bias, -0.2, 0.2);
  };

  const initialAdoption = (): number => rng() * 0.1;

  const frames: Frame[] = [];
  const alpha = 0.15;
  const messageShock = 0.05;
  const shockSteps = 5;

  let current: Record<string, AgentFrameState> = {};
  for (const n of nodes) {
    const id = String(n.agent_id);
    const opinion = initialOpinion(id);
    const adoption = initialAdoption();
    current[id] = {
      opinion,
      sentiment: clamp((opinion + 1) / 2, 0, 1),
      adoption,
    };
  }
  frames.push({ t: 0, agents: { ...current } });

  for (let step = 1; step < timesteps; step++) {
    const next: Record<string, AgentFrameState> = {};

    for (const n of nodes) {
      const id = String(n.agent_id);
      const state = current[id];
      if (!state) continue;

      const neighbors = adj.get(id) ?? [];
      let neighborSum = 0;
      let neighborCount = 0;
      for (const { to } of neighbors) {
        const s = current[to];
        if (s) {
          neighborSum += s.opinion;
          neighborCount++;
        }
      }
      const neighborAvg = neighborCount > 0 ? neighborSum / neighborCount : state.opinion;

      let shock = 0;
      if (targetedSet.has(id) && step < shockSteps) {
        shock = messageShock;
      } else if (neighborCount > 0 && step < shockSteps) {
        const anyTargeted = neighbors.some(({ to }) => targetedSet.has(to));
        if (anyTargeted) shock = messageShock * 0.5;
      }

      const newOpinion = clamp(
        (1 - alpha) * state.opinion + alpha * neighborAvg + shock,
        -1,
        1
      );

      const adoptionDelta = Math.max(0, newOpinion) * 0.05;
      const newAdoption = clamp(state.adoption + adoptionDelta, 0, 1);

      const sentiment = clamp(
        0.5 * (newOpinion + 1) * 0.7 + newAdoption * 0.3,
        0,
        1
      );

      next[id] = {
        opinion: newOpinion,
        sentiment,
        adoption: newAdoption,
      };
    }

    current = next;
    frames.push({ t: step, agents: { ...current } });
  }

  const run: PlaybackRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    frames,
    meta: {
      timesteps: frames.length,
      seed,
      description: "Client-generated demo diffusion",
      targetedAgentIds: targetedAgentIds.length ? targetedAgentIds : undefined,
    },
  };

  return run;
}

import type { NodeData, EdgeData } from "../api/client";

const EPS = 1e-6;

export function edgeKey(source: string, target: string): string {
  const [a, b] = [source, target].sort();
  return `${a}--${b}`;
}

export type AdjacencyList = Map<string, { to: string; weight: number }[]>;

export function buildAdjacency(edges: EdgeData[]): AdjacencyList {
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const e of edges) {
    const s = String(e.source);
    const t = String(e.target);
    const w = typeof e.weight === "number" && e.weight > 0 ? e.weight : 1;
    if (!adj.has(s)) adj.set(s, []);
    adj.get(s)!.push({ to: t, weight: w });
    if (!adj.has(t)) adj.set(t, []);
    adj.get(t)!.push({ to: s, weight: w });
  }
  return adj;
}

export function bfsShortestPath(
  adj: AdjacencyList,
  src: string,
  dst: string
): string[] | null {
  const s = String(src);
  const d = String(dst);
  if (s === d) return [s];
  if (!adj.has(s) || !adj.has(d)) return null;
  const queue: string[] = [s];
  const parent = new Map<string, string>();
  parent.set(s, s);
  while (queue.length > 0) {
    const u = queue.shift()!;
    const neighbors = adj.get(u) ?? [];
    for (const { to: v } of neighbors) {
      if (parent.has(v)) continue;
      parent.set(v, u);
      if (v === d) {
        const path: string[] = [];
        let cur: string = d;
        while (cur !== s) {
          path.push(cur);
          cur = parent.get(cur)!;
        }
        path.push(s);
        path.reverse();
        return path;
      }
      queue.push(v);
    }
  }
  return null;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export function dijkstraInfluencePath(
  adj: AdjacencyList,
  nodesById: Map<string, NodeData>,
  src: string,
  dst: string
): string[] | null {
  const s = String(src);
  const d = String(dst);
  if (s === d) return [s];
  if (!adj.has(s) || !adj.has(d)) return null;

  const getInfluence = (id: string): number => {
    const node = nodesById.get(id);
    if (!node) return 0;
    const traits = node.traits ?? {};
    const social = traits.social_influence;
    if (typeof social === "number") return clamp(social, 0, 0.9);
    return clamp(node.degree_centrality ?? 0, 0, 0.9);
  };

  const dist = new Map<string, number>();
  const parent = new Map<string, string>();
  const pq: { id: string; d: number }[] = [{ id: s, d: 0 }];
  dist.set(s, 0);
  parent.set(s, s);

  const weightNorm = (w: number) => Math.max(w, 0.01);
  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const { id: u, d: du } = pq.shift()!;
    if (u === d) {
      const path: string[] = [];
      let cur: string = d;
      while (cur !== s) {
        path.push(cur);
        cur = parent.get(cur)!;
      }
      path.push(s);
      path.reverse();
      return path;
    }
    if (du > (dist.get(u) ?? Infinity)) continue;
    const influenceU = getInfluence(u);
    const neighbors = adj.get(u) ?? [];
    for (const { to: v, weight: w } of neighbors) {
      const baseCost = 1 / (weightNorm(w) + EPS);
      const adjustedCost = baseCost * (1 - influenceU);
      const cost = Math.max(adjustedCost, EPS);
      const alt = du + cost;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        parent.set(v, u);
        pq.push({ id: v, d: alt });
      }
    }
  }
  return null;
}

export function kHopNeighborhood(
  adj: AdjacencyList,
  center: string,
  k: number
): Set<string> {
  const c = String(center);
  const result = new Set<string>([c]);
  if (k < 1) return result;
  let frontier: string[] = [c];
  for (let hop = 0; hop < k; hop++) {
    const next: string[] = [];
    for (const u of frontier) {
      for (const { to: v } of adj.get(u) ?? []) {
        if (!result.has(v)) {
          result.add(v);
          next.push(v);
        }
      }
    }
    frontier = next;
  }
  return result;
}

export function pathToEdgeKeys(path: string[]): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    keys.add(edgeKey(path[i], path[i + 1]));
  }
  return keys;
}

export function neighborhoodEdgeKeys(
  adj: AdjacencyList,
  nodeIds: Set<string>
): Set<string> {
  const keys = new Set<string>();
  for (const u of nodeIds) {
    for (const { to: v } of adj.get(u) ?? []) {
      if (nodeIds.has(v)) keys.add(edgeKey(u, v));
    }
  }
  return keys;
}

const BASE = "";

export type GenderLabel = "male" | "female";

export interface NodeData {
  agent_id: string;
  degree: number;
  cluster: number;
  traits: Record<string, number>;
  degree_centrality: number;
  betweenness_centrality: number;
  /** Age in years (e.g. 18–80). Optional; missing uses neutral color. */
  age?: number;
  /** Gender for shape encoding. Optional; missing uses "unknown" (diamond). */
  gender?: string;
  /** Level of care (0–10). Passed in with personality. */
  level_of_care?: number;
  /** Effect on usage (-5 to 5). Passed in with personality. */
  effect_on_usage?: number;
  /** Text opinion string. Passed in with personality. */
  text_opinion?: string;
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
}

export interface GraphMetadata {
  node_count: number;
  edge_count: number;
  clusters: Record<string, number>;
  trait_keys: string[];
}

export interface GraphResponse {
  nodes: NodeData[];
  edges: EdgeData[];
  metadata: GraphMetadata;
}

export interface NeighborData {
  agent_id: string;
  weight: number;
  cluster: number;
  degree: number;
}

export interface NodeDetailResponse {
  node: NodeData;
  neighbors: NeighborData[];
}

export async function fetchGraph(): Promise<GraphResponse> {
  const res = await fetch(`${BASE}/api/graph/`);
  if (!res.ok) throw new Error(res.statusText || "Failed to fetch graph");
  return res.json();
}

export async function fetchNodeDetail(agentId: string): Promise<NodeDetailResponse> {
  const res = await fetch(`${BASE}/api/nodes/${encodeURIComponent(agentId)}/`);
  if (!res.ok) throw new Error(res.statusText || "Failed to fetch node");
  return res.json();
}

export async function uploadGraph(file: File): Promise<{ metadata: GraphMetadata }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/graph/upload/`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || res.statusText || "Upload failed");
  }
  return res.json();
}

/** Simulation run request */
export interface RunSimulationRequest {
  trigger: string;
  num_agents: number;
}

/** Graph shape returned by simulation API (agent_id as number, source/target as number) */
export interface SimulationNodeData {
  agent_id: number;
  degree?: number;
  cluster?: number;
  traits?: Record<string, number>;
  degree_centrality?: number;
  betweenness_centrality?: number;
  level_of_care?: number;
  age?: number;
  gender?: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
}

export interface SimulationEdgeData {
  source: number;
  target: number;
  weight?: number;
}

export interface SimulationGraphData {
  nodes: SimulationNodeData[];
  edges: SimulationEdgeData[];
}

export interface RunSimulationResponse {
  simulation_id: string;
  initial_graph: SimulationGraphData;
  final_graph: SimulationGraphData;
}

export async function runSimulation(
  trigger: string,
  numAgents: number
): Promise<RunSimulationResponse> {
  const res = await fetch(`${BASE}/api/simulations/run/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger, num_agents: numAgents } satisfies RunSimulationRequest),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.detail as string) || res.statusText || "Simulation run failed");
  }
  return res.json();
}

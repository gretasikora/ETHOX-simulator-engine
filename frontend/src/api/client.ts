const BASE = "";

export type GenderLabel = "male" | "female";

export interface NodeData {
  agent_id: string;
  degree: number;
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
  /** Text opinion string. Passed in with personality (final after simulation). */
  text_opinion?: string;
  /** Initial opinion string (after broadcast, before social influence). Set by run_full_simulation. */
  initial_opinion?: string;
  /** Initial level of care 0–1 (after broadcast). Set by run_full_simulation. */
  initial_level_of_care?: number;
  /** Initial effect on usage -5..5 (after broadcast). Set by run_full_simulation. */
  initial_effect_on_usage?: number;
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
}

export interface GraphMetadata {
  node_count: number;
  edge_count: number;
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

/** Report API request */
export interface SimulationReportRequest {
  simulation_id: string;
  trigger: string;
  include_initial: boolean;
}

/** Report API response */
export interface SimulationReportResponse {
  simulation_id: string;
  care_score_100: number;
  change_in_support_50: number;
  report_text: string;
}

export async function fetchSimulationReport(
  simulationId: string,
  trigger: string,
  includeInitial: boolean
): Promise<SimulationReportResponse> {
  const res = await fetch(`${BASE}/api/simulations/report/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      simulation_id: simulationId,
      trigger,
      include_initial: includeInitial,
    } satisfies SimulationReportRequest),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.detail as string) || res.statusText || "Failed to generate report");
  }
  return res.json();
}

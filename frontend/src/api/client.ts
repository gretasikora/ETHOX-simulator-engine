const BASE = "";

export interface NodeData {
  agent_id: string;
  degree: number;
  cluster: number;
  traits: Record<string, number>;
  degree_centrality: number;
  betweenness_centrality: number;
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

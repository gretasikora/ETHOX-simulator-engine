"""
Generate backend/data/network.json from the simulation's agents and adjacency matrix.

Uses init_agents() and build_adjacency_matrix() from the main simulation pipeline.
Run from project root: python backend/data/generate_network_from_simulation.py
"""
import json
import sys
from pathlib import Path

# Run from project root so simulation imports work
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import numpy as np
import networkx as nx


from simulation.init_network import init_agents
from simulation.network import build_adjacency_matrix


def _adjacency_to_edges(matrix: np.ndarray) -> list[dict]:
    """Convert NxN adjacency matrix to edges list. Undirected: one edge per (i,j) with i<j."""
    n = matrix.shape[0]
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            w = max(matrix[i, j], matrix[j, i])
            if w > 0:
                edges.append({
                    "source": str(i),
                    "target": str(j),
                    "weight": round(float(w), 4),
                })
    return edges


def _compute_degree(edges: list[dict], n: int) -> list[int]:
    """Count edges incident to each node."""
    degree = [0] * n
    for e in edges:
        i, j = int(e["source"]), int(e["target"])
        degree[i] += 1
        degree[j] += 1
    return degree


def _build_nx_graph(edges: list[dict], n: int) -> nx.Graph:
    """Build NetworkX graph from edges for centrality/cluster computation."""
    G = nx.Graph()
    G.add_nodes_from(range(n))
    for e in edges:
        G.add_edge(int(e["source"]), int(e["target"]), weight=e["weight"])
    return G


def _compute_clusters(edges: list[dict], n: int) -> list[int]:
    """Assign cluster ids via community detection. Falls back to 0 if detection fails."""
    if not edges:
        return [0] * n
    G = _build_nx_graph(edges, n)
    try:
        communities = list(nx.community.greedy_modularity_communities(G))
    except Exception:
        return [0] * n
    node_to_cluster = {}
    for cid, comm in enumerate(communities):
        for node in comm:
            node_to_cluster[node] = cid
    return [node_to_cluster.get(i, 0) for i in range(n)]


def _normalize_trait_1_5_to_0_1(val: float) -> float:
    """Map BFI-2 trait (1-5) to 0-1 for frontend coloring/filtering."""
    return round(float(np.clip((val - 1.0) / 4.0, 0.0, 1.0)), 4)


def export_network_json(agents, adjacency, out_path: Path | None = None) -> Path:
    """Convert agents + adjacency matrix to backend network.json format. Returns path written."""
    n = len(agents)

    edges = _adjacency_to_edges(adjacency)
    degree = _compute_degree(edges, n)
    clusters = _compute_clusters(edges, n)

    G = _build_nx_graph(edges, n)
    deg_centrality = nx.degree_centrality(G)
    betweenness = nx.betweenness_centrality(G) if G.number_of_edges() > 0 else {i: 0.0 for i in range(n)}

    # Map age_group to approximate age (years) for frontend color scale
    def _age_from_group(age_group):
        if not age_group:
            return None
        g = str(age_group).strip().lower()
        if "under" in g or "25" in g and "40" not in g:
            return 22
        if "25" in g and "40" in g:
            return 32
        if "40" in g or "40+" in g:
            return 55
        return 32

    def _normalize_gender(g):
        if not g:
            return None
        s = str(g).strip().lower()
        if s in ("male", "female"):
            return s
        if s.startswith("m"):
            return "male"
        if s.startswith("f"):
            return "female"
        return "female"  # default so shape/color encoding works

    nodes = []
    for i in range(n):
        a = agents[i]
        traits = {}
        if isinstance(a.traits, dict):
            for k, v in a.traits.items():
                try:
                    # Normalize BFI-2 (1-5) to 0-1 so frontend trait filter/colors work
                    traits[k] = _normalize_trait_1_5_to_0_1(float(v))
                except (TypeError, ValueError):
                    traits[str(k)] = 0.5
        cb = getattr(a, "customer_behavior", None) or {}
        age = _age_from_group(cb.get("age_group"))
        gender = _normalize_gender(cb.get("gender"))
        level_of_care = getattr(a, "level_of_care", None)
        effect_on_usage = getattr(a, "effect_on_usage", None)
        text_opinion = getattr(a, "text_opinion", None) or ""
        node = {
            "agent_id": str(i),
            "degree": degree[i],
            "cluster": clusters[i],
            "traits": traits,
            "degree_centrality": round(deg_centrality.get(i, 0.0), 4),
            "betweenness_centrality": round(betweenness.get(i, 0.0), 4),
        }
        if age is not None:
            node["age"] = age
        if gender is not None:
            node["gender"] = gender
        if level_of_care is not None:
            node["level_of_care"] = int(level_of_care)
        if effect_on_usage is not None:
            node["effect_on_usage"] = int(effect_on_usage)
        node["text_opinion"] = str(text_opinion)
        nodes.append(node)

    data = {"nodes": nodes, "edges": edges}
    if out_path is None:
        out_path = Path(__file__).parent / "network.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return out_path


def export_network() -> Path:
    """Init agents, build adjacency, export to backend network.json."""
    print("Initializing agents...")
    agents = init_agents()
    print("Building adjacency matrix...")
    adjacency = build_adjacency_matrix(agents)
    path = export_network_json(agents, adjacency)
    edges = _adjacency_to_edges(adjacency)
    print(f"Wrote {path} ({len(agents)} nodes, {len(edges)} edges)")
    return path


if __name__ == "__main__":
    export_network()

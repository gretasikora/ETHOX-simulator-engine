"""
Simulation service: runs main.py or stubs it to produce initial_graph and final_graph.

Interface: run_simulation(trigger: str, num_agents: int) -> (initial_graph, final_graph)
"""

import random
from typing import Any


def _generate_stub_graph(num_agents: int) -> dict[str, Any]:
    """Generate stub graph with nodes and edges for MVP."""
    nodes = []
    for i in range(num_agents):
        nodes.append({
            "agent_id": i,
            "degree": 0,
            "cluster": i % 3,
            "traits": {"Sociability": 0.5, "Assertiveness": 0.5},
            "degree_centrality": 0.1,
            "betweenness_centrality": 0.0,
            "age": 25 + (i % 50),
            "gender": "male" if i % 2 == 0 else "female",
        })

    edges = []
    max_edges = min(num_agents * 3, num_agents * (num_agents - 1) // 2)
    seen = set()
    for _ in range(max_edges):
        i, j = random.randint(0, num_agents - 1), random.randint(0, num_agents - 1)
        if i != j:
            key = (min(i, j), max(i, j))
            if key not in seen:
                seen.add(key)
                edges.append({"source": i, "target": j, "weight": round(random.uniform(0.3, 1.0), 4)})

    degree = [0] * num_agents
    for e in edges:
        degree[e["source"]] += 1
        degree[e["target"]] += 1
    for i, n in enumerate(nodes):
        n["degree"] = degree[i]

    return {"nodes": nodes, "edges": edges}


def run_simulation(trigger: str, num_agents: int) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Run simulation with given trigger and num_agents.
    Returns (initial_graph, final_graph).
    """
    random.seed(hash(trigger) % (2**32))

    initial = _generate_stub_graph(num_agents)

    final_nodes = []
    for n in initial["nodes"]:
        delta = random.uniform(-0.3, 0.3)
        new_loc = max(0.0, min(1.0, 0.5 + delta))
        final_nodes.append({**n, "level_of_care": round(new_loc, 4)})

    final = {"nodes": final_nodes, "edges": list(initial["edges"])}

    return initial, final

"""
Simulation service: runs main.py or stubs it to produce initial_graph and final_graph.

Interface: run_simulation(trigger: str, num_agents: int) -> (initial_graph, final_graph)
"""

import json
import random
from typing import Any


def _generate_stub_graph(num_agents: int, base_level_of_care: float) -> dict[str, Any]:
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
            "level_of_care": base_level_of_care,
            "age": 25 + (i % 50),
            "gender": "male" if i % 2 == 0 else "female",
        })

    edges = []
    # Create a sparse random graph
    max_edges = min(num_agents * 3, num_agents * (num_agents - 1) // 2)
    seen = set()
    for _ in range(max_edges):
        i, j = random.randint(0, num_agents - 1), random.randint(0, num_agents - 1)
        if i != j:
            key = (min(i, j), max(i, j))
            if key not in seen:
                seen.add(key)
                edges.append({"source": i, "target": j, "weight": round(random.uniform(0.3, 1.0), 4)})

    # Update degree
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

    For MVP: stub implementation that generates fake initial and final graphs.
    The final graph has modified level_of_care (0..1) per node based on random deltas.

    To wire up real main.py:
        import subprocess
        proc = subprocess.run([sys.executable, "main.py", ...], capture_output=True, cwd=ROOT)
        # Parse output or load from temp files
    """
    random.seed(hash(trigger) % (2**32))

    initial = _generate_stub_graph(num_agents, base_level_of_care=0.5)

    # Final graph: same structure, level_of_care changed by delta
    final_nodes = []
    for n in initial["nodes"]:
        delta = random.uniform(-0.3, 0.3)
        new_loc = max(0.0, min(1.0, (n.get("level_of_care") or 0.5) + delta))
        final_nodes.append({**n, "level_of_care": round(new_loc, 4)})

    final = {"nodes": final_nodes, "edges": list(initial["edges"])}

    return initial, final

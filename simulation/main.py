#!/usr/bin/env python3
"""
Run the workflow: load agents from JSON, compute connection scores, write adjacency matrix.
Usage: python main.py [path_to_agents.json]   (run from simulation/ or repo root as python simulation/main.py)
"""

import argparse
import sys
from pathlib import Path

# Run from repo root as python simulation/main.py or from simulation/ as python main.py
_sim_dir = Path(__file__).resolve().parent
if str(_sim_dir) not in sys.path:
    sys.path.insert(0, str(_sim_dir))

from agents import load_agents
from connection import build_adjacency_matrix


def main() -> None:
    parser = argparse.ArgumentParser(description="Load agents, build connection matrix, write outputs.")
    parser.add_argument(
        "agents_file",
        nargs="?",
        default="data/sample_agents.json",
        help="Path to JSON file of agents (default: data/sample_agents.json)",
    )
    parser.add_argument(
        "-o", "--output-dir",
        default="outputs",
        help="Directory for output files (default: outputs)",
    )
    args = parser.parse_args()

    root = _sim_dir
    agents_path = root / args.agents_file
    out_dir = root / args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    agents = load_agents(agents_path)
    agent_ids = [a["id"] for a in agents]
    print(f"Loaded {len(agents)} agents: ids {agent_ids}")

    matrix = build_adjacency_matrix(agents)
    print(f"Adjacency matrix shape: {matrix.shape}")

    csv_path = out_dir / "adjacency_matrix.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(",".join(str(i) for i in agent_ids) + "\n")
        for row in matrix:
            f.write(",".join(f"{v:.4f}" for v in row) + "\n")
    print(f"Wrote {csv_path}")


if __name__ == "__main__":
    main()

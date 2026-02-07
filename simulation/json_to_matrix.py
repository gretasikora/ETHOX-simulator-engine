#!/usr/bin/env python3
"""
Run the full workflow: load agents, build adjacency matrix, build social network,
cluster, and write outputs. Optional Plotly visualizations with --visualize.
"""

import argparse
import json
import sys
from pathlib import Path

_sim_dir = Path(__file__).resolve().parent
if str(_sim_dir) not in sys.path:
    sys.path.insert(0, str(_sim_dir))

from agents import load_agents
from connection import build_adjacency_matrix
from network import SocialNetwork


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load agents, build connection matrix and social network, write outputs."
    )
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
    parser.add_argument("--threshold", type=float, default=0.5, help="Edge probability threshold (default 0.5)")
    parser.add_argument("--steepness", type=float, default=10.0, help="Sigmoid steepness for probabilistic (default 10)")
    parser.add_argument(
        "--method",
        choices=["probabilistic", "threshold", "knn"],
        default="probabilistic",
        help="Graph build method (default: probabilistic)",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default 42)")
    parser.add_argument("--n-clusters", type=int, default=4, help="Number of clusters (default 4)")
    parser.add_argument("--visualize", action="store_true", help="Generate Plotly HTML visualizations")
    args = parser.parse_args()

    root = _sim_dir
    agents_path = root / args.agents_file
    out_dir = root / args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load agents
    agents = load_agents(agents_path)
    agent_ids = [a["id"] for a in agents]
    print(f"Loaded {len(agents)} agents: ids {agent_ids[:10]}{'...' if len(agent_ids) > 10 else ''}")

    # 2. Build adjacency matrix
    matrix = build_adjacency_matrix(agents)
    print(f"Adjacency matrix shape: {matrix.shape}")

    # 3. Build social network
    net = SocialNetwork(agents, matrix)
    build_stats = net.build_graph(
        threshold=args.threshold,
        steepness=args.steepness,
        method=args.method,
        seed=args.seed,
    )
    print(f"Graph: {build_stats['nodes']} nodes, {build_stats['edges']} edges, density {build_stats['density']:.4f}")

    # 4. Clusters and profiles
    clusters = net.assign_clusters(n_clusters=args.n_clusters, seed=args.seed)
    profiles = net.get_cluster_profiles(clusters)
    print(f"Clusters: {len(clusters)}")

    # 5. Print stats and profiles
    stats = net.get_network_stats()
    print("\n--- Network stats ---")
    print(f"  num_nodes: {stats['num_nodes']}, num_edges: {stats['num_edges']}")
    print(f"  avg_degree: {stats['avg_degree']:.2f}, clustering: {stats['clustering_coefficient']:.4f}")
    print(f"  connected_components: {stats['connected_components']}")
    if stats.get("modularity") is not None:
        print(f"  modularity: {stats['modularity']:.4f}")
    print("\n--- Cluster profiles ---")
    for cid, prof in profiles.items():
        print(f"  Cluster {cid}: {prof['label']}")
        print(f"    size={prof['size']}, avg_degree={prof['avg_degree']}, internal_density={prof['internal_density']}")

    # 6. Write outputs
    csv_path = out_dir / "adjacency_matrix.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(",".join(str(i) for i in agent_ids) + "\n")
        for row in matrix:
            f.write(",".join(f"{v:.4f}" for v in row) + "\n")
    print(f"\nWrote {csv_path}")

    network_json = out_dir / "network.json"
    with open(network_json, "w", encoding="utf-8") as f:
        json.dump(net.to_json(), f, indent=2)
    print(f"Wrote {network_json}")

    net.export_graphml(str(out_dir / "graph.graphml"))
    print(f"Wrote {out_dir / 'graph.graphml'}")

    with open(out_dir / "network_stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"Wrote {out_dir / 'network_stats.json'}")

    with open(out_dir / "cluster_profiles.json", "w", encoding="utf-8") as f:
        json.dump({str(k): v for k, v in profiles.items()}, f, indent=2)
    print(f"Wrote {out_dir / 'cluster_profiles.json'}")

    if args.visualize:
        try:
            import visualization as viz
            fig = viz.plot_network(net, color_by="cluster", size_by="degree")
            fig.write_html(str(out_dir / "network_plot.html"))
            print(f"Wrote {out_dir / 'network_plot.html'}")
            fig2 = viz.plot_cluster_scatter(net)
            fig2.write_html(str(out_dir / "cluster_scatter.html"))
            print(f"Wrote {out_dir / 'cluster_scatter.html'}")
            fig3 = viz.plot_degree_distribution(net)
            fig3.write_html(str(out_dir / "degree_distribution.html"))
            print(f"Wrote {out_dir / 'degree_distribution.html'}")
            fig4 = viz.plot_cluster_heatmap(net)
            fig4.write_html(str(out_dir / "cluster_heatmap.html"))
            print(f"Wrote {out_dir / 'cluster_heatmap.html'}")
        except ImportError as e:
            print(f"Visualization skipped (install plotly): {e}")


if __name__ == "__main__":
    main()

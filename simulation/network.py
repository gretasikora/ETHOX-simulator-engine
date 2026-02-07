import numpy as np
import networkx as nx
import matplotlib.pyplot as plt


def similarity_score(agent_a, agent_b):
    traits_a = agent_a.traits or {}
    traits_b = agent_b.traits or {}
    keys = set(traits_a.keys()) & set(traits_b.keys())
    if not keys:
        return 0.0
    diffs = [abs(float(traits_a[k]) - float(traits_b[k])) for k in keys]
    mean_diff = sum(diffs) / len(diffs)
    return float(max(0.0, 1.0 - (mean_diff / 4.0)))


def build_adjacency_matrix(agents):
    n = len(agents)
    matrix = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i, j] = similarity_score(agents[i], agents[j])
    print(matrix)
    return matrix


def connection_count(agent):
    return 0


def influencibility(agent):
    return 0.5


def visualize_adjacency_matrix(matrix, out_path, labels=None):
    G = nx.from_numpy_array(matrix)
    pos = nx.spring_layout(G, seed=42)
    plt.figure(figsize=(8, 6))
    nx.draw_networkx_nodes(G, pos, node_size=300, node_color="#4C78A8", alpha=0.9)
    nx.draw_networkx_edges(G, pos, width=1.0, alpha=0.4)
    if labels is None:
        labels = {i: str(i) for i in G.nodes()}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=8, font_color="#222222")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()

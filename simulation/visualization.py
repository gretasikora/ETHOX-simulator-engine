"""
Standalone Plotly visualizations for SocialNetwork. No Plotly dependency in network.py.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import networkx as nx
import numpy as np

if TYPE_CHECKING:
    from network import SocialNetwork

# Categorical palette (8+ colors) for clusters
CLUSTER_COLORS = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
]


def _get_layout(network: "SocialNetwork", layout: str = "spring") -> dict[Any, tuple[float, float]]:
    G = network.graph
    if layout == "spring":
        pos = nx.spring_layout(G, k=2.5, iterations=80, seed=42)
    else:
        pos = nx.spring_layout(G, k=2.5, iterations=80, seed=42)
    return pos


def plot_network(
    network: "SocialNetwork",
    color_by: str = "cluster",
    size_by: str = "degree",
    layout: str = "spring",
) -> "Any":
    """Interactive Plotly scatter of the network. Returns plotly.graph_objects.Figure."""
    import plotly.graph_objects as go

    G = network.graph
    pos = _get_layout(network, layout)
    nodes = list(G.nodes())
    x = [pos[n][0] for n in nodes]
    y = [pos[n][1] for n in nodes]
    degrees = [G.degree(n) for n in nodes]
    sizes = [10 + d * 2.5 if size_by == "degree" else 12 for d in degrees]

    if color_by == "cluster":
        clusters = [G.nodes[n].get("cluster", -1) for n in nodes]
        uniq = sorted(set(c for c in clusters if c is not None and c >= 0))
        color_idx = [uniq.index(c) if c in uniq else len(uniq) for c in clusters]
        colors = [CLUSTER_COLORS[i % len(CLUSTER_COLORS)] for i in color_idx]
    else:
        colors = [float(G.degree(n)) for n in nodes]
        # will use continuous color scale

    traits_str = []
    for n in nodes:
        data = G.nodes[n]
        tr = data.get("traits") or {}
        top3 = sorted(tr.items(), key=lambda x: -x[1])[:3]
        traits_str.append(", ".join(f"{k}: {v:.2f}" for k, v in top3))
    hover = [
        f"ID: {n}<br>Cluster: {G.nodes[n].get('cluster', '—')}<br>Degree: {G.degree(n)}<br>Traits: {t}"
        for n, t in zip(nodes, traits_str)
    ]

    edge_x, edge_y = [], []
    for u, v in G.edges():
        w = G.edges[u, v].get("weight", 0.5)
        edge_x.extend([pos[u][0], pos[v][0], None])
        edge_y.extend([pos[u][1], pos[v][1], None])
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=0.8, color="rgba(150,150,150,0.4)"),
        hoverinfo="none",
        mode="lines",
    )
    # Make edge opacity proportional to weight (per edge we'd need segments; simplify with single trace)
    node_trace = go.Scatter(
        x=x, y=y,
        mode="markers+text",
        text=[str(n) for n in nodes],
        textposition="top center",
        textfont=dict(size=8),
        marker=dict(
            size=sizes,
            color=colors if color_by != "degree" else None,
            colorscale="Viridis" if color_by == "degree" else None,
            line=dict(width=0.5, color="gray"),
        ),
        hovertext=hover,
        hoverinfo="text",
    )
    fig = go.Figure(data=[edge_trace, node_trace])
    fig.update_layout(
        title="Customer Society Network",
        showlegend=False,
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        plot_bgcolor="white",
        height=650,
    )
    return fig


def plot_cluster_scatter(network: "SocialNetwork") -> "Any":
    """PCA 2D of trait matrix, points colored by cluster, with profile labels in legend."""
    import plotly.graph_objects as go
    from sklearn.decomposition import PCA

    G = network.graph
    nodes = list(G.nodes())
    trait_keys = sorted(set().union(*(G.nodes[n].get("traits") or {} for n in nodes)))
    if not trait_keys:
        trait_keys = ["social_influence"]
    X = np.array([
        [float((G.nodes[n].get("traits") or {}).get(k, 0.5)) for k in trait_keys]
        for n in nodes
    ])
    pca = PCA(n_components=2, random_state=42)
    X2 = pca.fit_transform(X)
    ids = nodes
    clusters = [G.nodes[n].get("cluster", -1) for n in nodes]
    profiles = getattr(network, "_cluster_profiles", None) or {}
    fig = go.Figure()
    uniq_c = sorted(set(c for c in clusters if c is not None and c >= 0))
    for c in uniq_c:
        mask = [cl == c for cl in clusters]
        xs = [X2[i][0] for i in range(len(ids)) if mask[i]]
        ys = [X2[i][1] for i in range(len(ids)) if mask[i]]
        label = profiles.get(c, {}).get("label", f"Cluster {c}")
        fig.add_trace(go.Scatter(
            x=xs, y=ys, mode="markers",
            name=label,
            marker=dict(size=10, color=CLUSTER_COLORS[c % len(CLUSTER_COLORS)]),
            text=[str(ids[i]) for i in range(len(ids)) if mask[i]],
            hoverinfo="text",
        ))
    fig.update_layout(
        title="Agents in PCA space (by cluster)",
        xaxis_title="PC1", yaxis_title="PC2",
        height=500, plot_bgcolor="white",
    )
    return fig


def plot_degree_distribution(network: "SocialNetwork") -> "Any":
    """Bar chart: degree -> count. Color bars by hub (degree > mean + 1 std)."""
    import plotly.graph_objects as go

    G = network.graph
    degs = [G.degree(n) for n in G.nodes()]
    if not degs:
        return go.Figure()
    dist = {}
    for d in degs:
        dist[d] = dist.get(d, 0) + 1
    mean_d = np.mean(degs)
    std_d = np.std(degs) or 1
    hub_threshold = mean_d + std_d
    degrees = sorted(dist.keys())
    counts = [dist[d] for d in degrees]
    colors = ["#d62728" if d > hub_threshold else "#1f77b4" for d in degrees]
    fig = go.Figure(data=[go.Bar(x=degrees, y=counts, marker_color=colors)])
    fig.update_layout(
        title="Degree distribution (red = hub)",
        xaxis_title="Degree",
        yaxis_title="Count",
        height=400,
        plot_bgcolor="white",
    )
    return fig


def plot_cluster_heatmap(network: "SocialNetwork") -> "Any":
    """Heatmap of cross-cluster edge density. Diagonal = within-cluster density."""
    import plotly.graph_objects as go

    density = network.get_cross_cluster_density()
    if not density:
        return go.Figure()
    cids = sorted(density.keys())
    z = [[density[ca].get(cb, 0) for cb in cids] for ca in cids]
    fig = go.Figure(data=go.Heatmap(
        z=z, x=cids, y=cids,
        colorscale="YlOrRd",
        text=[[f"{z[i][j]:.2f}" for j in range(len(cids))] for i in range(len(cids))],
        texttemplate="%{text}",
        textfont={"size": 10},
    ))
    fig.update_layout(
        title="Cross-cluster edge density",
        xaxis_title="Cluster",
        yaxis_title="Cluster",
        height=500,
        plot_bgcolor="white",
    )
    return fig

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np

from config import SEED
# ---- Facet groupings (BFI-2 structure) ----
EXTRAVERSION_FACETS = ("Sociability", "Assertiveness", "Energy Level")
CONSC_FACETS = ("Organization", "Productiveness", "Responsibility")
NEG_EMO_FACETS = ("Anxiety", "Depression", "Emotional Volatility")
OPEN_FACETS = ("Intellectual Curiosity", "Aesthetic Sensitivity", "Creative Imagination")


def _to_0_1(x_1_to_5: float) -> float:
    """Map 1..5 -> 0..1, with clipping."""
    return float(np.clip((x_1_to_5 - 1.0) / 4.0, 0.0, 1.0))


def _sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-z))


def compute_extrovertedness(traits_1_to_5: Dict[str, float]) -> float:
    """
    Research grounding:
    - BFI-2 Extraversion domain is composed of Sociability, Assertiveness, Energy Level.
      (Soto & John 2017 BFI-2 definition)
    Operational choice:
    - Weight Sociability highest for "talks to many people".
    """
    s = _to_0_1(traits_1_to_5["Sociability"])
    a = _to_0_1(traits_1_to_5["Assertiveness"])
    e = _to_0_1(traits_1_to_5["Energy Level"])

    # Weights sum to 1.0
    return float(0.55 * s + 0.20 * a + 0.25 * e)


def compute_influencibility(traits_1_to_5: Dict[str, float]) -> float:
    """
    Research grounding:
    - Empirical work on susceptibility to social influence strategies often finds
      Neuroticism (Negative Emotionality), Openness, and Conscientiousness as key predictors,
      while Agreeableness/Extraversion may be less predictive in those models.
    Implementation:
    - Build N/O/C composites from the corresponding BFI-2 facet sets, then pass through sigmoid.
    """
    N = np.mean([_to_0_1(traits_1_to_5[f]) for f in NEG_EMO_FACETS])   # Negative Emotionality
    O = np.mean([_to_0_1(traits_1_to_5[f]) for f in OPEN_FACETS])      # Open-Mindedness
    C = np.mean([_to_0_1(traits_1_to_5[f]) for f in CONSC_FACETS])     # Conscientiousness

    # Default weights (tune later with calibration/backtesting)
    b0 = -0.8
    wN, wO, wC = 1.2, 0.6, 0.6

    return float(_sigmoid(b0 + wN * N + wO * O + wC * C))

def sample_num_interactions(
    traits_1_to_5: Dict[str, float],
    rng: np.random.Generator,
    min_deg: int = 0,
    max_deg: int = 50,
) -> int:
    """
    Sample how many other agents this agent interacts with.

    - Driven purely by extrovertedness (BFI-2 Extraversion facets)
    - Population average ≈ 3 interactions
    - Uses an exponential distribution for natural skew
    """

    # extrovertedness in [0,1]
    ext = compute_extrovertedness(traits_1_to_5)

    # map extroversion -> exponential mean
    # ext ≈ 0.5 -> mu ≈ 3
    mu = 1.0 + 4.0 * ext

    # sample and discretize
    k = int(round(rng.exponential(scale=mu)))

    # clamp to sensible bounds
    return int(np.clip(k, min_deg, max_deg))


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
    rng = np.random.default_rng(SEED)
    for i in range(n):
        scores = []
        for j in range(n):
            if i == j:
                continue
            score = similarity_score(agents[i], agents[j])
            scores.append((j, score))
        scores.sort(key=lambda x: x[1], reverse=True)
        k = sample_num_interactions(agents[i].traits, rng, min_deg=0, max_deg=max(0, n - 1))
        top = scores[:k]
        for j, score in top:
            matrix[i, j] = score
    return matrix

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

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

def precompute_personality_context(all_agents, eps=1e-8):
    """
    Analyzes the population to create a whitening transform.
    Returns a 'context' dictionary used for the similarity_score function.
    """
    if not all_agents:
        return None
        
    # 1. Identify traits and vectorize the whole population
    keys = sorted(list(all_agents[0].traits.keys()))
    X = np.array([[float(a.traits.get(k, 3.0)) for k in keys] for a in all_agents])
    N, D = X.shape

    # 2. Z-Score / Standardization
    means = X.mean(axis=0, keepdims=True)
    sds = X.std(axis=0, ddof=0, keepdims=True)
    sds = np.where(sds < eps, 1.0, sds)
    Xz = (X - means) / sds

    # 3. Whitening Transform (Mahalanobis)
    Sigma = np.cov(Xz, rowvar=False, ddof=0)
    vals, vecs = np.linalg.eigh(Sigma)
    vals_clipped = np.clip(vals, eps, None)
    W = vecs @ np.diag(1.0 / np.sqrt(vals_clipped)) @ vecs.T

    # 4. Determine Lambda (Density scaling)
    # We transform everyone to find the median distance for a smart RBF scale
    Xw = Xz @ W.T
    # Calculate a sample of distances to find a good lambda
    # For large N, we use a subset to save time
    sample_size = min(N, 500)
    Xw_sample = Xw[:sample_size]
    dists = np.sum((Xw_sample[:, None] - Xw_sample[None, :])**2, axis=2)
    
    iu = np.triu_indices(sample_size, k=1)
    med = np.median(dists[iu]) if len(iu[0]) > 0 else 1.0
    rbf_lambda = 1.0 / (2.0 * med) if med > 0 else 0.5

    return {
        "W": W,
        "means": means,
        "sds": sds,
        "keys": keys,
        "rbf_lambda": float(rbf_lambda)
    }

def similarity_score(agent_a, agent_b, context):
    """
    Calculates the whitened RBF similarity between two agents.
    Returns a float between 0.0 and 1.0.
    """
    if context is None:
        return 0.0
        
    # 1. Extract and align traits
    keys = context["keys"]
    v_a = np.array([float(agent_a.traits.get(k, 3.0)) for k in keys])
    v_b = np.array([float(agent_b.traits.get(k, 3.0)) for k in keys])

    # 2. Project into Whitened Space
    # (Value - Mean) / SD, then multiply by Whitening Matrix
    means = context["means"].reshape(-1)
    sds = context["sds"].reshape(-1)
    w_a = ((v_a - means) / sds) @ context["W"].T
    w_b = ((v_b - means) / sds) @ context["W"].T

    # 3. RBF Kernel
    d2 = np.sum((w_a - w_b)**2)
    similarity = np.exp(-context["rbf_lambda"] * d2)

    return float(np.clip(similarity, 0.0, 1.0))


def build_adjacency_matrix(agents, context):
    n = len(agents)
    matrix = np.zeros((n, n), dtype=np.float64)
    rng = np.random.default_rng(SEED)
    for i in range(n):
        scores = []
        for j in range(n):
            if i == j:
                continue
            score = similarity_score(agents[i], agents[j], context)
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

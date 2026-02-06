"""Connection score and adjacency matrix from agents."""

from __future__ import annotations

from typing import Any

import numpy as np

from agents import get_influence_score, get_state, get_trait


def connection_score(agent_i: dict[str, Any], agent_j: dict[str, Any]) -> float:
    """
    Connection score for a pair (i, j) in [0, 1].
    Uses social_influence, influence_score, sentiment similarity, and loyalty.
    """
    social_i = get_trait(agent_i, "social_influence", 0.5)
    social_j = get_trait(agent_j, "social_influence", 0.5)
    inf_i = get_influence_score(agent_i)
    inf_j = get_influence_score(agent_j)

    base = (social_i + social_j) / 2
    influence = (inf_i + inf_j) / 2

    sent_i = get_state(agent_i, "sentiment")
    sent_j = get_state(agent_j, "sentiment")
    if sent_i is not None and sent_j is not None:
        sent_i, sent_j = float(sent_i), float(sent_j)
        sentiment_sim = 1.0 - min(1.0, abs(sent_i - sent_j) / 2.0)
    else:
        sentiment_sim = 1.0

    loyalty_i = get_trait(agent_i, "loyalty", 0.5)
    loyalty_j = get_trait(agent_j, "loyalty", 0.5)
    loyalty_factor = (loyalty_i + loyalty_j) / 2

    score = base * 0.35 + influence * 0.35 + sentiment_sim * 0.2 + loyalty_factor * 0.1
    return float(np.clip(score, 0.0, 1.0))


def build_adjacency_matrix(agents: list[dict[str, Any]]) -> np.ndarray:
    """Compute N×N adjacency matrix of connection scores. Diagonal is 0."""
    n = len(agents)
    matrix = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i, j] = connection_score(agents[i], agents[j])
    return matrix

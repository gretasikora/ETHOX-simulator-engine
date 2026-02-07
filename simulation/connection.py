"""Connection score and adjacency matrix from agents."""

from __future__ import annotations

from typing import Any

import numpy as np

from agents import get_influence_score, get_state, get_trait


def connection_score(agent_source: dict[str, Any], agent_target: dict[str, Any]) -> float:
    """
    Directed connection score: how strongly *source* rates/values connection to *target* [0, 1].
    Asymmetric: score(A→B) can differ from score(B→A).
    - Symmetric part: similarity (social_influence, sentiment, loyalty of both).
    - Directional part: target's influence_score (more influential targets get higher ratings from others).
    """
    social_s = get_trait(agent_source, "social_influence", 0.5)
    social_t = get_trait(agent_target, "social_influence", 0.5)
    inf_s = get_influence_score(agent_source)
    inf_t = get_influence_score(agent_target)

    base = (social_s + social_t) / 2
    influence_sym = (inf_s + inf_t) / 2

    sent_s = get_state(agent_source, "sentiment")
    sent_t = get_state(agent_target, "sentiment")
    if sent_s is not None and sent_t is not None:
        sentiment_sim = 1.0 - min(1.0, abs(float(sent_s) - float(sent_t)) / 2.0)
    else:
        sentiment_sim = 1.0

    loyalty_s = get_trait(agent_source, "loyalty", 0.5)
    loyalty_t = get_trait(agent_target, "loyalty", 0.5)
    loyalty_factor = (loyalty_s + loyalty_t) / 2

    similarity = base * 0.35 + influence_sym * 0.35 + sentiment_sim * 0.2 + loyalty_factor * 0.1
    # Asymmetric: source rates target higher when target is more influential (pull of target)
    directional = 0.4 + 0.6 * inf_t
    score = similarity * directional
    return float(np.clip(score, 0.0, 1.0))


def build_adjacency_matrix(agents: list[dict[str, Any]]) -> np.ndarray:
    """
    Compute N×N adjacency matrix. Entry [i,j] = how strongly i rates connection to j (directed).
    Diagonal is 0. matrix[i,j] need not equal matrix[j,i].
    """
    n = len(agents)
    matrix = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i, j] = connection_score(agents[i], agents[j])  # i rates j
    return matrix

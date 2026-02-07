#!/usr/bin/env python3
"""
Test that the connection score and adjacency matrix are asymmetric (A→B ≠ B→A when influences differ).
Run from repo root: python simulation/test_connection_asymmetric.py
Or from simulation/: python test_connection_asymmetric.py
"""

import sys
from pathlib import Path

# Allow importing simulation modules
_sim = Path(__file__).resolve().parent
if str(_sim) not in sys.path:
    sys.path.insert(0, str(_sim))

from connection import connection_score, build_adjacency_matrix


def _agent(agent_id: int, influence_score: float, social: float = 0.5, loyalty: float = 0.5) -> dict:
    return {
        "id": agent_id,
        "archetype": "test",
        "traits": {"social_influence": social, "loyalty": loyalty, "price_sensitivity": 0.5},
        "state": {"sentiment": 0.0, "active": True},
        "memory": [],
        "neighbors": [],
        "influence_score": influence_score,
    }


def test_directed_score_asymmetric() -> None:
    """When A and B have different influence_score, A→B and B→A must differ."""
    # A: low influence (0.2), B: high influence (0.9) — same otherwise
    a = _agent(1, influence_score=0.2)
    b = _agent(2, influence_score=0.9)

    score_a_to_b = connection_score(a, b)  # a rates b (target b has high influence → higher score)
    score_b_to_a = connection_score(b, a)  # b rates a (target a has low influence → lower score)

    assert score_a_to_b > score_b_to_a, (
        f"Expected score(A→B) > score(B→A) when B is more influential. "
        f"Got A→B={score_a_to_b:.4f}, B→A={score_b_to_a:.4f}"
    )
    print(f"  score(A->B) = {score_a_to_b:.4f}, score(B->A) = {score_b_to_a:.4f}  (A->B > B->A ok)")


def test_directed_score_symmetric_when_same_influence() -> None:
    """When A and B have the same influence_score, A→B and B→A are equal."""
    a = _agent(1, influence_score=0.6)
    b = _agent(2, influence_score=0.6)

    score_a_to_b = connection_score(a, b)
    score_b_to_a = connection_score(b, a)

    assert abs(score_a_to_b - score_b_to_a) < 1e-9, (
        f"Expected score(A→B) == score(B→A) when influences equal. "
        f"Got A→B={score_a_to_b:.4f}, B→A={score_b_to_a:.4f}"
    )
    print(f"  score(A->B) = score(B->A) = {score_a_to_b:.4f} when influence equal ok")


def test_matrix_asymmetric() -> None:
    """Adjacency matrix [i,j] and [j,i] must differ when agents have different influence."""
    agents = [
        _agent(1, influence_score=0.2),
        _agent(2, influence_score=0.9),
    ]
    matrix = build_adjacency_matrix(agents)

    assert matrix[0, 1] != matrix[1, 0], (
        f"Expected matrix[0,1] != matrix[1,0]. Got matrix[0,1]={matrix[0,1]:.4f}, matrix[1,0]={matrix[1,0]:.4f}"
    )
    assert matrix[0, 1] > matrix[1, 0], (
        f"Expected matrix[0,1] (1 rates 2) > matrix[1,0] (2 rates 1). "
        f"Got matrix[0,1]={matrix[0,1]:.4f}, matrix[1,0]={matrix[1,0]:.4f}"
    )
    print(f"  matrix[0,1] = {matrix[0,1]:.4f}, matrix[1,0] = {matrix[1,0]:.4f}  (asymmetric ok)")


def test_matrix_diagonal_zero() -> None:
    """Diagonal should remain 0."""
    agents = [_agent(i, influence_score=0.5) for i in range(1, 4)]
    matrix = build_adjacency_matrix(agents)
    for i in range(3):
        assert matrix[i, i] == 0.0, f"Expected matrix[{i},{i}] = 0, got {matrix[i,i]}"
    print("  diagonal is 0 ok")


def main() -> None:
    print("Testing asymmetric connection score and matrix...")
    test_directed_score_asymmetric()
    test_directed_score_symmetric_when_same_influence()
    test_matrix_asymmetric()
    test_matrix_diagonal_zero()
    print("All tests passed.")


if __name__ == "__main__":
    main()

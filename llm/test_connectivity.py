#!/usr/bin/env python3
"""
Test the LLM connectivity prompt: build prompt for two agents, parse response, optional live call.
Run from repo root: python llm/test_connectivity.py
"""

import sys
from pathlib import Path

# Add project root so we can import simulation.agents and llm
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from llm.connectivity_prompt import (
    build_connectivity_prompt,
    parse_connectivity_score,
    connection_score_llm,
)


def _mock_llm(prompt: str) -> str:
    """Returns a fixed score so we can test without an API."""
    return "0.65"


def test_parse() -> None:
    assert parse_connectivity_score("0.72") == 0.72
    assert parse_connectivity_score("0") == 0.0
    assert parse_connectivity_score("1.0") == 1.0
    assert parse_connectivity_score("Score: 0.42") == 0.42
    assert parse_connectivity_score("The connection score is 0.88.") == 0.88
    assert parse_connectivity_score("") == 0.5
    assert parse_connectivity_score("nope") == 0.5
    print("parse_connectivity_score: OK")


def test_with_sample_agents() -> None:
    """Build prompt for two agents from simulation sample data; run with mock LLM."""
    sim_dir = _root / "simulation"
    if str(sim_dir) not in sys.path:
        sys.path.insert(0, str(sim_dir))
    try:
        from agents import load_agents
    except ImportError:
        from simulation.agents import load_agents
    data_path = _root / "simulation" / "data" / "sample_agents.json"
    if not data_path.exists():
        data_path = _root / "simulation" / "data" / "sample_agents_large.json"
    if not data_path.exists():
        print("No sample_agents.json or sample_agents_large.json found; skipping agent test.")
        return
    agents = load_agents(data_path)
    if len(agents) < 2:
        print("Need at least 2 agents; skipping.")
        return
    a, b = agents[0], agents[1]
    prompt = build_connectivity_prompt(a, b)
    print("\n--- Generated prompt (first 800 chars) ---\n")
    print(prompt[:800])
    if len(prompt) > 800:
        print("\n... [truncated]")
    print("\n--- End prompt ---\n")
    score = connection_score_llm(a, b, _mock_llm)
    assert 0 <= score <= 1
    print(f"Mock LLM returned '0.65' -> parsed score: {score}")
    print("connection_score_llm with mock: OK")


def main() -> None:
    print("Testing LLM connectivity prompt...")
    test_parse()
    test_with_sample_agents()
    print("\nTo test with a real LLM, call build_connectivity_prompt(agent_i, agent_j),")
    print("send the result to your llm_generate(), then parse_connectivity_score(response).")


if __name__ == "__main__":
    main()

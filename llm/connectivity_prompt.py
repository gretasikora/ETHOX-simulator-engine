"""
LLM-based connectivity score for the adjacency matrix.
Builds a prompt for the AI to return a 0-1 connection score between two agents.

Usage with your client:
  from llm.client import llm_generate  # or wherever your llm_generate lives
  from llm.connectivity_prompt import build_connectivity_prompt, parse_connectivity_score, connection_score_llm

  # One pair:
  prompt = build_connectivity_prompt(agent_i, agent_j)
  response = llm_generate(prompt)
  score = parse_connectivity_score(response)

  # Or in one call:
  score = connection_score_llm(agent_i, agent_j, llm_generate)
"""

from __future__ import annotations

import re
from typing import Any, Callable


# ---------------------------------------------------------------------------
# Prompt template (edit this to change how the AI judges connectivity)
# ---------------------------------------------------------------------------

CONNECTIVITY_SYSTEM = """You are scoring the strength of connection between two people in a synthetic customer society. The score drives who is linked in a social network: higher score = more likely to interact, influence each other, or share similar behavior.

Output exactly one number between 0 and 1 (e.g. 0.0, 0.42, 0.87, 1.0). No explanation. Use decimals. Consider:
- Similarity in traits (e.g. both high in social influence, or both loyal)
- Complementary or aligned personality (e.g. similar sentiment, openness)
- How likely they would interact or influence each other in real life
- Influence potential (high-influence people can connect to many; similarity still matters)
"""


def _agent_summary(agent: dict[str, Any], label: str) -> str:
    """Turn one agent dict into a short text block for the prompt."""
    parts = [f"{label}: id={agent.get('id')}, archetype={agent.get('archetype', 'unknown')}"]
    traits = agent.get("traits") or {}
    if traits:
        # Top traits by value (or all if few)
        sorted_traits = sorted(traits.items(), key=lambda x: -x[1])
        trait_str = ", ".join(f"{k}={round(v, 2)}" for k, v in sorted_traits[:12])
        parts.append(f"  traits: {trait_str}")
    state = agent.get("state") or {}
    if state:
        parts.append(f"  state: {state}")
    inf = agent.get("influence_score")
    if inf is not None:
        parts.append(f"  influence_score: {round(float(inf), 2)}")
    return "\n".join(parts)


def build_connectivity_prompt(agent_i: dict[str, Any], agent_j: dict[str, Any]) -> str:
    """
    Build the prompt to send to the LLM for one pair (i, j).
    The model should return a single number in [0, 1].
    """
    block_a = _agent_summary(agent_i, "Agent A")
    block_b = _agent_summary(agent_j, "Agent B")
    return f"""{CONNECTIVITY_SYSTEM}

---
{block_a}

---
{block_b}

---
Connection score (0-1, one number only):"""


def _clip(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def parse_connectivity_score(response: str) -> float:
    """
    Parse the LLM response into a float in [0, 1].
    Tolerates "0.72", "Score: 0.72", or text containing a number.
    """
    if not response or not response.strip():
        return 0.5
    text = response.strip()
    try:
        return _clip(float(text), 0.0, 1.0)
    except ValueError:
        pass
    match = re.search(r"0?\.\d+|1\.0|1(?:\.0+)?|\b0\b", text)
    if match:
        try:
            return _clip(float(match.group()), 0.0, 1.0)
        except ValueError:
            pass
    return 0.5


def connection_score_llm(
    agent_i: dict[str, Any],
    agent_j: dict[str, Any],
    llm_generate: Callable[[str], str],
) -> float:
    """
    One-shot LLM connectivity score for a pair. Uses your llm_generate(prompt).
    Returns float in [0, 1]. Use this when building the adjacency matrix via LLM.
    """
    prompt = build_connectivity_prompt(agent_i, agent_j)
    raw = llm_generate(prompt)
    return parse_connectivity_score(raw)

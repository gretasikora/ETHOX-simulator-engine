"""
In-memory store for completed simulation agent outputs, keyed by simulation_id.
Used by the report API to reconstruct AgentProxy objects for supervisor_summarize.
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class AgentProxy:
    """Lightweight proxy for build_supervisor_summary_prompt / supervisor_summarize."""

    id: int
    opinion: str
    care: float  # 0-10
    usage_effect: float  # -5 to 5
    initial_opinion: str | None = None
    initial_care: float | None = None
    initial_usage_effect: float | None = None


# simulation_id -> { "trigger": str, "agents": list[dict] }
_store: dict[str, dict[str, Any]] = {}


def _node_to_agent_proxy(node: dict) -> AgentProxy:
    """Convert a final_graph node to AgentProxy."""
    agent_id = node.get("agent_id")
    if isinstance(agent_id, str):
        agent_id = int(agent_id) if agent_id.isdigit() else 0

    # level_of_care: 0..1 in graph, care: 0..10 for prompt
    loc = node.get("level_of_care")
    if loc is not None:
        care = float(loc) * 10.0
    else:
        care = 0.0

    # effect_on_usage: -5..5 (already correct)
    effect = node.get("effect_on_usage")
    usage_effect = float(effect) if effect is not None else 0.0

    opinion = str(node.get("text_opinion") or node.get("opinion") or "")

    # Initial values (after broadcast, before social influence)
    init_opinion = node.get("initial_opinion")
    init_loc = node.get("initial_level_of_care")
    init_effect = node.get("initial_effect_on_usage")
    initial_care = float(init_loc) * 10.0 if init_loc is not None else None
    initial_usage = int(init_effect) if init_effect is not None else None

    return AgentProxy(
        id=agent_id,
        opinion=opinion,
        care=care,
        usage_effect=usage_effect,
        initial_opinion=str(init_opinion) if init_opinion is not None else None,
        initial_care=initial_care,
        initial_usage_effect=float(initial_usage) if initial_usage is not None else None,
    )


def store_simulation(simulation_id: str, trigger: str, final_graph: dict) -> None:
    """Store agent outputs from final_graph keyed by simulation_id."""
    nodes = final_graph.get("nodes") or []
    # Preserve full node dict for _node_to_agent_proxy
    agents_data = [dict(n) for n in nodes]
    _store[simulation_id] = {"trigger": trigger, "agents": agents_data}


def get_agents(simulation_id: str) -> tuple[list[AgentProxy], str] | None:
    """
    Retrieve stored agents and trigger for a simulation.
    Returns (agents, trigger) or None if not found.
    """
    entry = _store.get(simulation_id)
    if not entry:
        return None
    agents = [_node_to_agent_proxy(a) for a in entry["agents"]]
    return agents, entry["trigger"]

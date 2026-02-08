"""
Store for completed simulation agent outputs, keyed by simulation_id.
Uses in-memory cache and file persistence so reports work across requests/restarts.
Used by the report API to reconstruct AgentProxy objects for supervisor_summarize.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


def _simulations_dir() -> Path:
    from django.conf import settings
    d = getattr(settings, "DATA_DIR", None) or Path(__file__).resolve().parent.parent / "data"
    sim_dir = d / "simulations"
    sim_dir.mkdir(parents=True, exist_ok=True)
    return sim_dir


@dataclass
class AgentProxy:
    """Lightweight proxy for build_supervisor_summary_prompt / supervisor_summarize."""

    id: int
    opinion: str
    care: float  # 0-10
    change_in_support: float  # -5 to 5
    initial_opinion: str | None = None
    initial_care: float | None = None
    initial_change_in_support: float | None = None
    # Aliases used by supervisor_summarize prompt
    usage_effect: float = 0
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
    change_in_support = float(effect) if effect is not None else 0.0

    opinion = str(node.get("text_opinion") or node.get("opinion") or "")

    # Initial values (after broadcast, before social influence)
    init_opinion = node.get("initial_opinion")
    init_loc = node.get("initial_level_of_care")
    init_effect = node.get("initial_effect_on_usage")
    initial_care = float(init_loc) * 10.0 if init_loc is not None else None
    initial_usage = int(init_effect) if init_effect is not None else None

    init_support = float(initial_usage) if initial_usage is not None else None
    return AgentProxy(
        id=agent_id,
        opinion=opinion,
        care=care,
        change_in_support=change_in_support,
        initial_opinion=str(init_opinion) if init_opinion is not None else None,
        initial_care=initial_care,
        initial_change_in_support=init_support,
        usage_effect=change_in_support,
        initial_usage_effect=init_support,
    )


def store_simulation(simulation_id: str, trigger: str, final_graph: dict) -> None:
    """Store agent outputs from final_graph keyed by simulation_id (memory + file)."""
    nodes = final_graph.get("nodes") or []
    agents_data = [dict(n) for n in nodes]
    entry = {"trigger": trigger, "agents": agents_data}
    _store[simulation_id] = entry
    try:
        path = _simulations_dir() / f"{simulation_id}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entry, f, indent=0)
    except OSError:
        pass  # keep in-memory only if file write fails


def get_agents(simulation_id: str) -> tuple[list[AgentProxy], str] | None:
    """
    Retrieve stored agents and trigger for a simulation.
    Checks in-memory first, then persisted file. Returns (agents, trigger) or None if not found.
    """
    entry = _store.get(simulation_id)
    if not entry:
        try:
            path = _simulations_dir() / f"{simulation_id}.json"
            if path.exists():
                with open(path, encoding="utf-8") as f:
                    entry = json.load(f)
                _store[simulation_id] = entry
        except (OSError, json.JSONDecodeError):
            pass
    if not entry:
        return None
    agents = [_node_to_agent_proxy(a) for a in entry["agents"]]
    return agents, entry["trigger"]

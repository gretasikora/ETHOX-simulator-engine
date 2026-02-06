"""Load and read agent data from JSON."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def agent_from_dict(data: dict[str, Any]) -> dict[str, Any]:
    """Parse one agent from JSON. Requires id, archetype, traits, state, memory, neighbors. Keeps extra keys."""
    required = {"id", "archetype", "traits", "state", "memory", "neighbors"}
    if not required.issubset(data.keys()):
        missing = required - data.keys()
        raise ValueError(f"Agent missing required keys: {missing}")

    out: dict[str, Any] = {
        "id": int(data["id"]),
        "archetype": str(data["archetype"]),
        "traits": dict(data["traits"]),
        "state": dict(data["state"]),
        "memory": list(data["memory"]),
        "neighbors": [int(n) for n in data["neighbors"]],
    }
    if "influence_score" in data:
        out["influence_score"] = float(data["influence_score"])
    for k, v in data.items():
        if k not in out:
            out[k] = v
    return out


def load_agents(path: str | Path) -> list[dict[str, Any]]:
    """Load agents from a JSON file (list of agents or dict of id -> agent)."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Agents file not found: {path}")
    with open(p, encoding="utf-8") as f:
        raw = json.load(f)
    if isinstance(raw, list):
        return [agent_from_dict(a) for a in raw]
    if isinstance(raw, dict):
        return [agent_from_dict(v) for v in raw.values()]
    raise ValueError("JSON must be a list of agents or a dict of id -> agent")


def get_trait(agent: dict[str, Any], key: str, default: float = 0.0) -> float:
    """Get a trait value (0–1 typical)."""
    t = agent.get("traits") or {}
    val = t.get(key)
    if val is None:
        return default
    return float(val)


def get_state(agent: dict[str, Any], key: str, default: Any = None) -> Any:
    """Get a state value (e.g. sentiment -1..1, active bool)."""
    s = agent.get("state") or {}
    return s.get(key, default)


def get_influence_score(agent: dict[str, Any], default: float = 0.5) -> float:
    """Per-agent influence_score; default if missing."""
    return float(agent.get("influence_score", default))

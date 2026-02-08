"""
Simulation service: runs full LLM pipeline and returns initial_graph, post_trigger_graph, final_graph.

Interface: run_simulation(trigger: str, num_agents: int) -> (initial_graph, post_trigger_graph, final_graph)
"""

import sys
from pathlib import Path
from typing import Any

# Ensure project root is in path when called from Django (backend/)
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from simulation.runner import run_full_simulation


def run_simulation(trigger: str, num_agents: int) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    """
    Run full simulation with LLM (broadcast trigger + social influence).
    Returns (initial_graph, post_trigger_graph, final_graph).
    """
    initial, post_trigger, final, _agents, _adjacency = run_full_simulation(trigger, num_agents)
    return initial, post_trigger, final

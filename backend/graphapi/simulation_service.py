"""
Simulation service: runs full LLM pipeline and returns initial_graph and final_graph.

Interface: run_simulation(trigger: str, num_agents: int) -> (initial_graph, final_graph)
Agents are generated on demand via BFI-2 personality sampling. level_of_care, effect_on_usage,
text_opinion from LLM.
"""

import sys
from pathlib import Path
from typing import Any

# Ensure project root is in path when called from Django (backend/)
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from simulation.runner import run_full_simulation


def run_simulation(trigger: str, num_agents: int) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Run full simulation with LLM (broadcast trigger + social influence).
    Returns (initial_graph, final_graph).
    """
    initial, final, _agents, _adjacency = run_full_simulation(trigger, num_agents)
    return initial, final

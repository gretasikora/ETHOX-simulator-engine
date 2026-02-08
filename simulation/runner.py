"""
Simulation runner: runs the full LLM pipeline (broadcast_trigger + social influence).

Returns (initial_graph, final_graph) for use by the API or main.py script.
"""

from typing import Any

from backend.data.generate_network_from_simulation import build_network_data
from simulation.init_network import init_agents
from simulation.interaction import broadcast_trigger, update_opinion_from_neighbors
from simulation.network import (
    build_adjacency_matrix,
    compute_influencibility,
    precompute_personality_context,
    similarity_score,
)


def run_full_simulation(trigger: str, num_agents: int) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Run the full simulation with LLM: broadcast trigger, social influence.
    Returns (initial_graph, final_graph, agents, adjacency).
    - initial_graph: structure + traits, no level_of_care (agents haven't reacted yet).
    - final_graph: structure + traits + level_of_care, effect_on_usage, text_opinion from LLM.
    """
    agents = init_agents(num_agents)
    context = precompute_personality_context(agents)
    adjacency = build_adjacency_matrix(agents, context)

    # Initial graph: before any LLM calls (no opinion/care/usage yet)
    initial = build_network_data(agents, adjacency, agent_id_as_int=True)

    # Broadcast trigger: each agent reacts via LLM
    broadcast_trigger(agents, trigger)

    # Store initial for comparison (optional, used by supervisor_summarize)
    for agent in agents:
        agent.initial_opinion = agent.opinion
        agent.initial_care = agent.care
        agent.initial_change_in_support = agent.change_in_support

    # Social influence: each agent updates based on neighbors
    for i, agent in enumerate(agents):
        neighbor_opinions = []
        weights = {}
        for j, other in enumerate(agents):
            if i == j:
                continue
            if adjacency[i, j] > 0:
                neighbor_opinions.append((other.id, other.opinion))
                care = similarity_score(agent, other, context) * compute_influencibility(agent.traits)
                weights[other.id] = care
        update_opinion_from_neighbors(agent, trigger, neighbor_opinions, weights, self_weight=1.0)

    # Final graph: after social influence (agents have opinion, care, change_in_support)
    final = build_network_data(agents, adjacency, agent_id_as_int=True)

    return initial, final, agents, adjacency

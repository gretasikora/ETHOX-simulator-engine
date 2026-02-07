# main.py
from simulation.init_network import init_agents
from simulation.interaction import broadcast_trigger, update_opinion_from_neighbors
from simulation.network import build_adjacency_matrix, visualize_adjacency_matrix, compute_influencibility, similarity_score
from config import TRIGGER_EVENT_MESSAGE
from pathlib import Path

agents = init_agents()

adjacency = build_adjacency_matrix(agents)
out_dir = Path("simulation") / "outputs"
out_dir.mkdir(parents=True, exist_ok=True)
labels = {i: str(a.id) for i, a in enumerate(agents)}
visualize_adjacency_matrix(adjacency, out_dir / "network.png", labels=labels)

broadcast_trigger(agents, TRIGGER_EVENT_MESSAGE)

print("\n\n\n\n")

for i, agent in enumerate(agents):
    neighbor_opinions = []
    weights = {}
    for j, other in enumerate(agents):
        if i == j:
            continue
        if adjacency[i, j] > 0:
            neighbor_opinions.append((other.id, other.opinion))
            care = similarity_score(agent, other) * compute_influencibility(agent.traits)
            weights[other.id] = care
    update_opinion_from_neighbors(agent, TRIGGER_EVENT_MESSAGE, neighbor_opinions, weights, self_weight=1.0)

print("DONE")

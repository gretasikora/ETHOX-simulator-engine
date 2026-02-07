# main.py
from simulation.init_network import init_agents
from simulation.interaction import broadcast_trigger, update_opinion_from_neighbors, supervisor_summarize
from simulation.network import build_adjacency_matrix, visualize_adjacency_matrix, compute_influencibility, similarity_score, precompute_personality_context
from config import TRIGGER_EVENT_MESSAGE
from pathlib import Path

from backend.data.generate_network_from_simulation import export_network_json

agents = init_agents()

context = precompute_personality_context(agents)

adjacency = build_adjacency_matrix(agents, context)

# Export network for backend/website
backend_data = Path(__file__).parent / "backend" / "data"
export_network_json(agents, adjacency, backend_data / "network.json")

out_dir = Path("simulation") / "outputs"
out_dir.mkdir(parents=True, exist_ok=True)
labels = {i: str(a.id) for i, a in enumerate(agents)}
visualize_adjacency_matrix(adjacency, out_dir / "network.png", labels=labels)

broadcast_trigger(agents, TRIGGER_EVENT_MESSAGE)

# Store initial opinions before social influence for comparison
for agent in agents:
    agent.initial_opinion = agent.opinion
    agent.initial_care = agent.care
    agent.initial_usage_effect = agent.usage_effect

print("\n\n\n\n")

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
    update_opinion_from_neighbors(agent, TRIGGER_EVENT_MESSAGE, neighbor_opinions, weights, self_weight=1.0)

# Generate supervisor summary
print("\n" + "="*80)
print("SUPERVISOR SUMMARY")
print("="*80)
summary = supervisor_summarize(agents, TRIGGER_EVENT_MESSAGE, include_initial=True)
print(summary)
print("="*80)

# Save supervisor summary to file
with open(out_dir / "supervisor_summary.txt", "w") as f:
    f.write(f"Event: {TRIGGER_EVENT_MESSAGE}\n\n")
    f.write(summary)

print("\nDONE")

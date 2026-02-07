# main.py
from simulation.init_network import init_agents
from simulation.interaction import broadcast_trigger
from simulation.network import build_adjacency_matrix, visualize_adjacency_matrix
from config import TRIGGER_EVENT_MESSAGE
from pathlib import Path

agents = init_agents()

adjacency = build_adjacency_matrix(agents)
out_dir = Path("simulation") / "outputs"
out_dir.mkdir(parents=True, exist_ok=True)
labels = {i: str(a.id) for i, a in enumerate(agents)}
visualize_adjacency_matrix(adjacency, out_dir / "network.png", labels=labels)

broadcast_trigger(agents, TRIGGER_EVENT_MESSAGE)

print("DONE")

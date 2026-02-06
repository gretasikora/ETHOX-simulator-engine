# main.py
import random
from simulation.init_network import init_agents
from simulation.interaction import interact
from config import WARMUP_ROUNDS

agents = init_agents()

for _ in range(WARMUP_ROUNDS):
    a, b = random.sample(agents, 2)
    interact(a, b, context="Casual chat on the platform")

print("DONE")

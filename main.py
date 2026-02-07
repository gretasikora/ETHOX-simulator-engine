# main.py
import random
from simulation.init_network import init_agents
from simulation.interaction import interact, broadcast_trigger
from config import TRIGGER_EVENT_MESSAGE, WARMUP_ROUNDS

agents = init_agents()

for _ in range(WARMUP_ROUNDS):
    a, b = random.sample(agents, 2)
    interact(a, b, context="Casual chat on the platform")

broadcast_trigger(agents, TRIGGER_EVENT_MESSAGE)

print("DONE")

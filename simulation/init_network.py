# simulation/init_network.py
from agents.agent import Agent

def init_agents():
    agents = []
    for i in range(20):
        traits = {
            "openness": round(i / 20, 2),
            "agreeableness": round(1 - i / 20, 2)
        }
        agents.append(Agent(i, traits))
    return agents

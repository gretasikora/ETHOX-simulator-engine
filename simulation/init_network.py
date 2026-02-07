# simulation/init_network.py
from agents.agent import Agent
from config import NUM_AGENTS, SEED
from personalities.sampling import generate_personality_traits

def init_agents():
    agents = []
    print("hi")
    # traits_list = generate_personality_traits(n=NUM_AGENTS, seed=SEED)
    traits_list = ["Rude, disagree with everything, think lowly of everyone else", "Homophobic, very vocal","Gay, love talking about it"]
    print(traits_list)
    # assign behaviour to each agent based on their traits
    for i in range(NUM_AGENTS):
        agents.append(Agent(i, traits_list[i]))
    return agents

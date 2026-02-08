# simulation/init_network.py
import random
import pandas as pd
from agents.agent import Agent
from config import NUM_AGENTS, SEED
from personalities.sampling import generate_personality_traits

def init_agents():
    agents = []

    voter_df = pd.read_csv("datasets/voter_opinion_survey_350.csv")
    random.seed(SEED)
    available_lines = list(range(len(voter_df)))
    selected_indices = random.sample(available_lines, NUM_AGENTS)
    
    traits_list = generate_personality_traits(n=NUM_AGENTS, seed=SEED)
    print(traits_list)
    
    for i in range(NUM_AGENTS):
        voter_profile = voter_df.iloc[selected_indices[i]].to_dict()
        agents.append(Agent(i, traits_list[i], voter_profile))
    
    return agents

# simulation/init_network.py
import os
import random
import pandas as pd
from agents.agent import Agent
from config import NUM_AGENTS, SEED
from personalities.sampling import generate_personality_traits

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def init_agents(num_agents: int | None = None):
    """Initialize agents. If num_agents is omitted, uses NUM_AGENTS from config."""
    n = num_agents if num_agents is not None else NUM_AGENTS
    agents = []

    csv_path = os.path.join(_BASE, "datasets", "voter_opinion_survey_350.csv")
    voter_df = pd.read_csv(csv_path)
    random.seed(SEED)
    available_lines = list(range(len(voter_df)))
    sample_size = min(n, len(available_lines))
    selected_indices = random.sample(available_lines, sample_size)
    
    traits_list = generate_personality_traits(n=sample_size, seed=SEED)

    for i in range(sample_size):
        voter_profile = voter_df.iloc[selected_indices[i]].to_dict()
        agents.append(Agent(i, traits_list[i], voter_profile))
    
    return agents

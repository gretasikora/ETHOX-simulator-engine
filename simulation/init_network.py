# simulation/init_network.py
import os
import random
import pandas as pd
from agents.agent import Agent
from config import NUM_AGENTS, SEED
from personalities.sampling import generate_personality_traits

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def init_agents(num_agents: int | None = None, seed: int | None = None):
    """Initialize agents. If num_agents is omitted, uses NUM_AGENTS from config."""
    n = num_agents if num_agents is not None else NUM_AGENTS
    agents = []

    csv_path = os.path.join(_BASE, "datasets", "voter_opinion_survey_350.csv")
    voter_df = pd.read_csv(csv_path)
    
    # Use provided seed or generate a random one
    if seed is None:
        seed = random.randint(0, 1000000)
    
    # Seed random for reproducible sampling *for this run*
    random.seed(seed)
    
    available_lines = list(range(len(voter_df)))
    sample_size = min(n, len(available_lines))
    selected_indices = random.sample(available_lines, sample_size)
    
    traits_list = generate_personality_traits(n=sample_size, seed=seed)

    for i in range(sample_size):
        voter_profile = voter_df.iloc[selected_indices[i]].to_dict()
        agents.append(Agent(i, traits_list[i], voter_profile))
    
    return agents

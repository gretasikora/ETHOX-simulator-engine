# simulation/init_network.py
import random
import pandas as pd
from agents.agent import Agent
from config import NUM_AGENTS, SEED
from personalities.sampling import generate_personality_traits


def init_agents(num_agents: int = NUM_AGENTS) -> list[Agent]:
    """
    Generate num_agents with BFI-2 traits and demographics.
    level_of_care, effect_on_usage, text_opinion are determined by the simulation (LLM).
    """
    agents = []
    voter_df = pd.read_csv("datasets/voter_opinion_survey_350.csv")
    random.seed(SEED)
    available_lines = list(range(len(voter_df)))
    selected_indices = random.sample(available_lines, num_agents)

    traits_list = generate_personality_traits(n=num_agents, seed=SEED)

    for i in range(num_agents):
        voter_profile = voter_df.iloc[selected_indices[i]].to_dict()
        agents.append(Agent(i, traits_list[i], voter_profile))
    return agents

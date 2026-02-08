# simulation/init_network.py
from agents.agent import Agent
from personalities.sampling import FACETS, generate_society

# BFI-2 facet columns (matches personalities/sampling FACETS)
FACET_COLUMNS = [
    "Sociability", "Assertiveness", "Energy Level", "Compassion", "Respectfulness",
    "Trust", "Organization", "Productiveness", "Responsibility",
    "Anxiety", "Depression", "Emotional Volatility",
    "Intellectual Curiosity", "Aesthetic Sensitivity", "Creative Imagination",
]


def init_agents(num_agents: int) -> list[Agent]:
    """
    Generate num_agents with BFI-2 traits and demographics.
    level_of_care, effect_on_usage, text_opinion are determined by the simulation (LLM).
    """
    df = generate_society(n=num_agents)
    agents = []
    for i in range(len(df)):
        row = df.iloc[i]
        traits = {col: float(row[col]) for col in FACET_COLUMNS if col in df.columns}
        customer_behavior = {"gender": str(row.get("gender", "")), "age_group": str(row.get("age_group", ""))}
        agents.append(Agent(i, traits, customer_behavior))
    return agents

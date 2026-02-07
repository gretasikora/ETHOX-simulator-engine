# simulation/init_network.py
import pandas as pd
from agents.agent import Agent

# BFI-2 facet columns in synthetic society CSV
FACET_COLUMNS = [
    "Sociability", "Assertiveness", "Energy Level", "Compassion", "Respectfulness",
    "Trust", "Organization", "Productiveness", "Responsibility",
    "Anxiety", "Depression", "Emotional Volatility",
    "Intellectual Curiosity", "Aesthetic Sensitivity", "Creative Imagination",
]

SYNTHETIC_SOCIETY_PATH = "synthetic_society_20.csv"


def init_agents():
    df = pd.read_csv(SYNTHETIC_SOCIETY_PATH)
    agents = []
    for i in range(len(df)):
        row = df.iloc[i]
        traits = {col: float(row[col]) for col in FACET_COLUMNS if col in df.columns}
        customer_behavior = {"gender": str(row.get("gender", "")), "age_group": str(row.get("age_group", ""))}
        agents.append(Agent(i, traits, customer_behavior))
    return agents

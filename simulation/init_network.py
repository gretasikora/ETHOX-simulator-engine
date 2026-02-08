# simulation/init_network.py
from pathlib import Path

import pandas as pd
from agents.agent import Agent

# BFI-2 facet columns in synthetic society CSV
FACET_COLUMNS = [
    "Sociability", "Assertiveness", "Energy Level", "Compassion", "Respectfulness",
    "Trust", "Organization", "Productiveness", "Responsibility",
    "Anxiety", "Depression", "Emotional Volatility",
    "Intellectual Curiosity", "Aesthetic Sensitivity", "Creative Imagination",
]

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
SYNTHETIC_SOCIETY_PATH = _PROJECT_ROOT / "synthetic_society_20.csv"


def init_agents():
    """
    Load agents from synthetic_society_20.csv.
    CSV provides only: traits (BFI-2), gender, age_group.
    level_of_care, effect_on_usage, text_opinion are determined by the simulation (LLM), not the CSV.
    """
    df = pd.read_csv(str(SYNTHETIC_SOCIETY_PATH))
    agents = []
    for i in range(len(df)):
        row = df.iloc[i]
        traits = {col: float(row[col]) for col in FACET_COLUMNS if col in df.columns}
        customer_behavior = {"gender": str(row.get("gender", "")), "age_group": str(row.get("age_group", ""))}
        agents.append(Agent(i, traits, customer_behavior))
    return agents

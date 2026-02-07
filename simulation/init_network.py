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
        level_of_care = row.get("level_of_care")
        if level_of_care is not None and level_of_care != "":
            try:
                level_of_care = int(float(level_of_care))
            except (TypeError, ValueError):
                level_of_care = None
        effect_on_usage = row.get("effect_on_usage")
        if effect_on_usage is not None and effect_on_usage != "":
            try:
                effect_on_usage = int(float(effect_on_usage))
            except (TypeError, ValueError):
                effect_on_usage = None
        text_opinion = row.get("text_opinion")
        if isinstance(text_opinion, float) and pd.isna(text_opinion):
            text_opinion = ""
        text_opinion = str(text_opinion or "").strip()
        agents.append(Agent(i, traits, customer_behavior, level_of_care=level_of_care, effect_on_usage=effect_on_usage, text_opinion=text_opinion))
    return agents

# simulation/init_network.py
import random
import pandas as pd
from agents.agent import Agent
from config import NUM_AGENTS, SEED
from personalities.sampling import generate_personality_traits

def init_agents():
    agents = []
    print("hi")

    customer_df = pd.read_csv("datasets/Amazon Customer Behavior Survey.csv")
    random.seed(SEED)
    # pandas automatically uses line 1 as header, so indices 0-N map to CSV lines 2-(N+2)
    available_lines = list(range(len(customer_df)))  # All data rows, header excluded by pandas
    selected_indices = random.sample(available_lines, NUM_AGENTS)
    
    # traits_list = generate_personality_traits(n=NUM_AGENTS, seed=SEED)
    traits_list = ["Rude, disagree with everything, think lowly of everyone else", "Homophobic, very vocal","Gay, love talking about it"]
    
    # Assign both personality and customer behavior to each agent
    for i in range(NUM_AGENTS):
        customer_behavior = customer_df.iloc[selected_indices[i]].to_dict()
        agents.append(Agent(i, traits_list[i], customer_behavior))
        print(f"Agent {i}: Line {selected_indices[i] + 2} (CSV row)")
    
    return agents

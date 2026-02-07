# agents/agent.py
class Agent:
    def __init__(self, id, traits, customer_behavior=None):
        self.id = id
        self.traits = traits
        self.customer_behavior = customer_behavior or {}
        self.memory = {}
        self.opinion = ""

    def remember(self, other_id, summary):
        self.memory[int(other_id)] = summary

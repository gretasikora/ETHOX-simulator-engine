# agents/agent.py
class Agent:
    def __init__(self, id, traits, customer_behavior=None, level_of_care=None, effect_on_usage=None, text_opinion=None):
        self.id = id
        self.traits = traits
        self.customer_behavior = customer_behavior or {}
        self.memory = {}
        self.opinion = ""
        self.care = 0
        self.usage_effect = 0

    def remember(self, other_id, summary):
        self.memory[int(other_id)] = summary

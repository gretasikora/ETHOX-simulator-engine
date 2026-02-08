# agents/agent.py
class Agent:
    def __init__(self, id, traits, voter_profile=None):
        self.id = id
        self.traits = traits
        self.voter_profile = voter_profile or {}
        self.customer_behavior = voter_profile or {}  # alias for interaction prompts
        self.memory = {}
        self.opinion = ""
        self.care = 0
        self.usage_effect = 0  # -5..5, set by LLM; also aliased as change_in_support
        self.change_in_support = 0  # kept for compatibility

    def remember(self, other_id, summary):
        self.memory[int(other_id)] = summary

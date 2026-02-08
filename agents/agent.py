# agents/agent.py
class Agent:
    def __init__(self, id, traits, voter_profile=None, level_of_care=None, change_in_support=None, text_opinion=None):
        self.id = id
        self.traits = traits
        self.voter_profile = voter_profile or {}
        self.memory = {}
        self.opinion = ""
        self.care = 0
        self.change_in_support = 0

    def remember(self, other_id, summary):
        self.memory[int(other_id)] = summary

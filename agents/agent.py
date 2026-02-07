# agents/agent.py
class Agent:
    def __init__(self, id, traits):
        self.id = id
        self.traits = traits
        self.memory = {}

    def remember(self, other_id, summary):
        self.memory[int(other_id)] = summary

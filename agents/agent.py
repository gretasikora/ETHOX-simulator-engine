# agents/agent.py
class Agent:
    def __init__(self, id, traits):
        self.id = id
        self.traits = traits
        self.memory = []

    def remember(self, text, k=3):
        self.memory.append(text)
        self.memory = self.memory[-k:]

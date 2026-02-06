# simulation/interaction.py
from llm.client import llm_generate

def build_prompt(speaker, listener, context):
    return f"""
You are Agent {speaker.id}.

Your personality:
{speaker.traits}

Recent memory:
{speaker.memory}

Context:
{context}

Say ONE short sentence to Agent {listener.id}.
"""

def interact(speaker, listener, context):
    msg = llm_generate(build_prompt(speaker, listener, context))
    speaker.remember(msg)
    listener.remember(msg)
    return msg

# simulation/interaction.py
import random

from llm.client import llm_generate


def build_turn_prompt(speaker, listener, context, transcript):
    prior = speaker.memory.get(listener.id, "No prior impression.")
    recent = transcript[-10:] if len(transcript) > 10 else transcript
    recent_text = "\n".join(recent) if recent else "(no messages yet)"
    return f"""
You are Agent {speaker.id}.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interact, make decisions, and react to situations. 

Your personality:
{speaker.traits}

You have been assigned a shopping behavior profile. Act accordingly.
Your profile:
{speaker.customer_behavior}

Your current impression of Agent {listener.id}:
{prior}

Conversation so far:
{recent_text}

Context:
{context}

Keeping your personality and profile in mind, reply in ONE sentence to Agent {listener.id}. Talk like a human.
"""


def build_summary_prompt(observer, other, transcript):
    transcript_text = "\n".join(transcript)
    return f"""
You are Agent {observer.id}.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interact, make decisions, and react to situations. 

Your personality:
{observer.traits}

You have been assigned a shopping behavior profile. Act accordingly.
Your profile:
{observer.customer_behavior}

Full conversation with Agent {other.id}:
{transcript_text}

Write a brief summary (1-2 sentences) of what you think about Agent {other.id}. Be honest. This is only for your memory.
"""


def run_conversation(a, b, context):
    turns = random.randint(2, 4)
    transcript = []
    speaker, listener = a, b
    for _ in range(turns):
        prompt = build_turn_prompt(speaker, listener, context, transcript)
        msg = llm_generate(prompt).strip()
        line = f"Agent {speaker.id}: {msg}"
        transcript.append(line)
        speaker, listener = listener, speaker
    return transcript


def interact(a, b, context):
    transcript = run_conversation(a, b, context)
    summary_a = llm_generate(build_summary_prompt(a, b, transcript)).strip()
    summary_b = llm_generate(build_summary_prompt(b, a, transcript)).strip()
    a.remember(b.id, summary_a)
    b.remember(a.id, summary_b)
    return transcript


def build_trigger_prompt(agent, event_message):
    return f"""
You are Agent {agent.id}.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interact, make decisions, and react to situations. 

Your personality:
{agent.traits}

You have been assigned a shopping behavior profile. Act accordingly.
Your profile:
{agent.customer_behavior}

Event:
{event_message}

Give an honest reaction to the event. It can be positive, negative or don't care. Also mention if and how this will affect your shopping behaviour.
"""


def trigger_reaction(agent, event_message):
    agent.opinion = llm_generate(build_trigger_prompt(agent, event_message)).strip()


def broadcast_trigger(agents, event_message):
    for agent in agents:
        trigger_reaction(agent, event_message)


def build_opinion_update_prompt(agent, event_message, neighbor_opinions, weights, self_weight=1.0):
    lines = []
    for (neighbor_id, opinion) in neighbor_opinions:
        w = weights.get(neighbor_id, 0.0)
        lines.append(f"- Agent {neighbor_id} (weight {w:.3f}): {opinion}")
    neighbor_block = "\n".join(lines) if lines else "(no neighbors)"
    return f"""
You are Agent {agent.id}.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interact, make decisions, and react to situations. 

Your personality:
{agent.traits}

You have been assigned a shopping behavior profile. Act accordingly.
Your profile:
{agent.customer_behavior}

Event:
{event_message}

Your current opinion on the event:
{agent.opinion}

Your self-weight is {self_weight:.3f}. The neighbors below have weighted opinions:
{neighbor_block}

Write ONE concise updated opinion sentence that reflects a weighted blend:
 - Higher weights should influence you more.
 - If no neighbors, keep your opinion unchanged.
"""


def update_opinion_from_neighbors(agent, event_message, neighbor_opinions, weights, self_weight=1.0):
    prompt = build_opinion_update_prompt(agent, event_message, neighbor_opinions, weights, self_weight=self_weight)
    updated = llm_generate(prompt).strip()
    print(agent.id, "\n", agent.opinion, "\n", updated)
    agent.opinion = updated
    return updated

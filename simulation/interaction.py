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
Each trait is scored from 1 (very low) to 5 (very high)
Your personality shapes HOW you interact, make decisions, and react to situations. Higher scores indicate stronger tendencies, and lower scores indicate weakness on the trait.

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
Each trait is scored from 1 (very low) to 5 (very high)
Your personality shapes HOW you interact, make decisions, and react to situations. Higher scores indicate stronger tendencies, and lower scores indicate weakness on the trait.

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
    turns = random.randint(10, 20)
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

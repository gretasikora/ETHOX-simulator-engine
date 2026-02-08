# simulation/interaction.py
import json
import re

from llm.client import llm_generate, llm_supervisor

def build_trigger_prompt(agent, event_message):
    return f"""
You are Agent {agent.id}. You are a customer of Amazon's online marketplace.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interact, make decisions, and react to situations. 

Your personality:
{agent.traits}

Event:
{event_message}

Return JSON only with these keys:
  opinion: string (given an honest reaction to the event, one concise sentence)
  care: number from 0 to 10 (how much you care about the event, 0 being indifferent, 10 being heavily care)
  usage_effect: number from -5 to 5 (impact of the event on your usage level, -5 being heavily reduce usage, 5 being heavily increase usage)
No extra text.
"""


def _clamp(value, lo, hi):
    try:
        v = float(value)
    except Exception:
        return lo
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def _parse_json_response(raw_text):
    try:
        return json.loads(raw_text)
    except Exception:
        match = re.search(r"\{.*\}", raw_text, flags=re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except Exception:
            return None


def trigger_reaction(agent, event_message):
    raw = llm_generate(build_trigger_prompt(agent, event_message)).strip()
    parsed = _parse_json_response(raw)
    if not isinstance(parsed, dict):
        agent.opinion = raw
        agent.care = 0
        agent.usage_effect = 0
        return
    agent.opinion = str(parsed.get("opinion", "")).strip()
    agent.care = _clamp(parsed.get("care", 0), 0, 10)
    agent.usage_effect = _clamp(parsed.get("usage_effect", 0), -5, 5)


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
You are Agent {agent.id}. You are a customer of Amazon's online marketplace.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interact, make decisions, and react to situations. 

Your personality:
{agent.traits}

You have been assigned a voting behavior profile. Act accordingly.
Your profile:
{agent.voter_profile}

Event:
{event_message}

Your current opinion on the event:
{agent.opinion}

Your current score of how much you are impacted by the event (0-10, 0 being indifferent, 10 being heavily care):
{agent.care}

Your current usage effect score (-5 to 5, -5 being heavily reduce usage, 5 being heavily increase usage):
{agent.usage_effect}

Your self-weight is {self_weight:.3f}. The neighbors below have weighted opinions:
{neighbor_block}

Return JSON only with these keys:
  opinion: string (one concise sentence)
  care: number from 0 to 10 (how much you care)
  usage_effect: number from -5 to 5 (impact on your usage level)
No extra text. Use neighbor weights to update your stance:
 - Higher weights should influence you more.
 - If no neighbors, keep your opinion unchanged.
"""

def update_opinion_from_neighbors(agent, event_message, neighbor_opinions, weights, self_weight=1.0):
    print("\n", agent.id, "\n", agent.opinion, agent.care, agent.usage_effect)
    prompt = build_opinion_update_prompt(agent, event_message, neighbor_opinions, weights, self_weight=self_weight)
    raw = llm_generate(prompt).strip()
    parsed = _parse_json_response(raw)
    if not isinstance(parsed, dict):
        print(agent.id, "\n", agent.opinion, "\n", raw)
        agent.care = 0
        agent.usage_effect = 0
        return agent.opinion
    updated = str(parsed.get("opinion", "")).strip()
    agent.care = _clamp(parsed.get("care", 0), 0, 10)
    agent.usage_effect = _clamp(parsed.get("usage_effect", 0), -5, 5)
    print("\n", agent.id, "\n", updated, agent.care, agent.usage_effect)
    agent.opinion = updated
    return updated


def build_supervisor_summary_prompt(agents, event_message, include_initial=False):
    """Build prompt for supervisor to summarize all agent opinions."""
    opinion_lines = []
    for agent in agents:
        if include_initial and hasattr(agent, 'initial_opinion'):
            opinion_lines.append(f"Customer {agent.id}:")
            opinion_lines.append(f"  Initial: {agent.initial_opinion} (care: {agent.initial_care}, usage_effect: {agent.initial_usage_effect})")
            opinion_lines.append(f"  Final: {agent.opinion} (care: {agent.care}, usage_effect: {agent.usage_effect})")
        else:
            opinion_lines.append(f"Customer {agent.id}: {agent.opinion} (care: {agent.care}/10, usage_effect: {agent.usage_effect})")

    opinions_block = "\n".join(opinion_lines)

    change_instruction = ""
    if include_initial:
        change_instruction = "\n7. How opinions and metrics shifted from initial reactions to final positions after social influence"

    return f"""
You are analyzing a simulation of {len(agents)} customers representing the client's diverse customer base. Each customer has different personality traits and shopping behaviors based on real demographic data and the BFI-2 psychological model.

Your goal is to provide an insightful summary of customer reactions and the possible consequences for the client's platform.

Event that triggered reactions:
{event_message}

{"Customer opinions (Initial → Final after social influence):" if include_initial else "Customer opinions:"}
{opinions_block}

Each customer has three metrics:
- opinion: their qualitative reaction to the event
- care: how much they care about the event (0-10 scale, 0=indifferent, 10=heavily care)
- usage_effect: predicted impact on their platform usage (-5 to +5 scale, -5=heavily reduce usage, +5=heavily increase usage)

Provide a comprehensive summary that includes:
1. Overall sentiment distribution (positive/negative/neutral/indifferent)
2. Care distribution and average engagement level with the event
3. Predicted net impact on platform usage (distribution and average of usage_effect scores)
4. Key themes or patterns in customer responses
5. Unique customer perspectives
6. Degree of consensus or polarization among the customer base{change_instruction}

Write in a professional consulting tone addressing the client about their customer base. Do not mention individuals as each profile represents a subgroup of customers. Keep the summary concise but insightful (3-5 paragraphs).
"""


def supervisor_summarize(agents, event_message, include_initial=False):
    """Generate a supervisor summary of all agent opinions using the more powerful LLM."""
    prompt = build_supervisor_summary_prompt(agents, event_message, include_initial=include_initial)
    summary = llm_supervisor(prompt).strip()
    return summary

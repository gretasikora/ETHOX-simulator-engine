# simulation/interaction.py
import json
import re

from llm.client import llm_generate, llm_supervisor

def build_trigger_prompt(agent, event_message):
    return f"""
You are Agent {agent.id}. You are a voter evaluating a policy narrative.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interpret information, make decisions, and react to political messaging. 

Your personality:
{agent.traits}

You have been assigned a voting behavior profile. Act accordingly.
Your profile:
{agent.voter_profile}

Policy narrative or claim:
{event_message}

Return JSON only with these keys:
  opinion: string - your critical opinion of the policy, whether that is negative/positive, and how you would interpret it given your profile
  care: number from 0 to 10 (how much you care about this policy/claim, 0 being indifferent, 10 being heavily care)
  change_in_support: number from -5 to 5 (impact on your support, -5 being strongly oppose, 5 being strongly support)
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
        agent.change_in_support = 0
        return
    agent.opinion = str(parsed.get("opinion", "")).strip()
    agent.care = _clamp(parsed.get("care", 0), 0, 10)
    agent.change_in_support = _clamp(parsed.get("change_in_support", 0), -5, 5)


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
You are Agent {agent.id}. You are a voter evaluating a policy narrative.

You have been assigned a personality profile based on the BFI-2, a validated psychological instrument measuring 15 personality facets across 5 major domains.
Each trait is scored from 1 (very low) to 5 (very high). A lower score means that your personality is closer to the opposite of the mentioned trait, and a higher score means that you are strong on the mentioned trait.
Your personality shapes HOW you interpret information, make decisions, and react to political messaging. 

Your personality:
{agent.traits}

You have been assigned a voter profile. Act accordingly.
Your profile:
{agent.voter_profile}

Policy narrative or claim:
{event_message}

Your current interpretation:
{agent.opinion}

Your current score of how much you care (0-10, 0 being indifferent, 10 being heavily care):
{agent.care}

Your current support score (-5 to 5, -5 being strongly oppose, 5 being strongly support):
{agent.change_in_support}

Your self-weight is {self_weight:.3f}. The neighbors below have weighted interpretations:
{neighbor_block}

Return JSON only with these keys:
  opinion: string (what you think this policy/claim means or does, one concise sentence)
  care: number from 0 to 10 (how much you care)
  change_in_support: number from -5 to 5 (impact on your support)
No extra text. Use neighbor weights to update your interpretation:
 - Higher weights should influence you more.
 - If no neighbors, keep your opinion unchanged.
"""

def update_opinion_from_neighbors(agent, event_message, neighbor_opinions, weights, self_weight=1.0):
    if not neighbor_opinions:
        return agent.opinion
    prompt = build_opinion_update_prompt(agent, event_message, neighbor_opinions, weights, self_weight=self_weight)
    raw = llm_generate(prompt).strip()
    parsed = _parse_json_response(raw)
    if not isinstance(parsed, dict):
        print(agent.id, "\n", agent.opinion, "\n", raw)
        agent.care = 0
        agent.change_in_support = 0
        return agent.opinion
    updated = str(parsed.get("opinion", "")).strip()
    agent.care = _clamp(parsed.get("care", 0), 0, 10)
    agent.change_in_support = _clamp(parsed.get("change_in_support", 0), -5, 5)
    agent.opinion = updated
    return updated


def build_supervisor_summary_prompt(agents, event_message, include_initial=False):
    """Build prompt for supervisor to summarize all agent opinions."""
    opinion_lines = []
    for agent in agents:
        if include_initial and hasattr(agent, 'initial_opinion'):
            opinion_lines.append(f"Customer {agent.id}:")
            opinion_lines.append(f"  Initial: {agent.initial_opinion} (care: {agent.initial_care}, change_in_support: {agent.initial_change_in_support})")
            opinion_lines.append(f"  Final: {agent.opinion} (care: {agent.care}, change_in_support: {agent.change_in_support})")
        else:
            opinion_lines.append(f"Customer {agent.id}: {agent.opinion} (care: {agent.care}/10, change_in_support: {agent.change_in_support})")

    opinions_block = "\n".join(opinion_lines)

    change_instruction = ""
    if include_initial:
        change_instruction = "\n7. How opinions and metrics shifted from initial reactions to final positions after social influence"

    return f"""

You are analyzing a simulation of {len(agents)} voters representing diverse segments of the electorate. Each voter has different personality traits and political behaviors based on real demographic data and the BFI-2 psychological model.

Your goal is to provide an insightful summary of how different groups interpret a policy narrative, where misunderstandings arise, and how interpretations spread through social networks.

Policy narrative or claim:
{event_message}

{"Voter interpretations (Initial → Final after social influence):" if include_initial else "Voter interpretations:"}
{opinions_block}

Each voter has three metrics:
- opinion: their interpretation of what the policy/claim means or does
- care: how much they care about this policy/claim (0-10 scale, 0=indifferent, 10=heavily care)
- change_in_support: their support level (-5 to +5 scale, -5=strongly oppose, +5=strongly support)

Provide a comprehensive summary that includes:
1. Top perceived meanings (what different groups think the policy does)
2. Care distribution and average engagement level
3. Support distribution (distribution and average of change_in_support scores)
4. Misunderstanding clusters and phrases that trigger them
5. Polarization patterns (which groups diverge and why)
6. Degree of consensus or fragmentation across voter segments{change_instruction}

Write in a professional consulting tone for policy communication strategists. Do not mention individuals as each profile represents a voter subgroup. Keep the summary concise but insightful (3-5 paragraphs).
"""


def supervisor_summarize(agents, event_message, include_initial=False):
    """Generate a supervisor summary of all agent opinions using the more powerful LLM."""
    prompt = build_supervisor_summary_prompt(agents, event_message, include_initial=include_initial)
    summary = llm_supervisor(prompt).strip()
    return summary

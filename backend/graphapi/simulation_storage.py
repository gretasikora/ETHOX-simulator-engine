"""
Unified storage for simulation results - saves to both database and files
"""
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from django.utils import timezone
from .models import SimulationRun, AgentState, NetworkSnapshot, SimulationSummary


def _simulations_dir() -> Path:
    """Get directory for file-based simulation backups"""
    from django.conf import settings
    d = getattr(settings, "DATA_DIR", None) or Path(__file__).resolve().parent.parent / "data"
    sim_dir = d / "simulations"
    sim_dir.mkdir(parents=True, exist_ok=True)
    return sim_dir


@dataclass
class AgentProxy:
    """Lightweight proxy for supervisor_summarize"""
    id: int
    opinion: str
    care: float  # 0-10
    change_in_support: float  # -5 to 5
    initial_opinion: str | None = None
    initial_care: float | None = None
    initial_change_in_support: float | None = None
    usage_effect: float = 0
    initial_usage_effect: float | None = None


def _node_to_agent_proxy(node: dict) -> AgentProxy:
    """Convert a graph node to AgentProxy"""
    agent_id = node.get("agent_id")
    if isinstance(agent_id, str):
        agent_id = int(agent_id) if agent_id.isdigit() else 0

    loc = node.get("level_of_care")
    care = float(loc) * 10.0 if loc is not None else 0.0

    effect = node.get("effect_on_usage")
    change_in_support = float(effect) if effect is not None else 0.0

    opinion = str(node.get("text_opinion") or node.get("opinion") or "")

    init_opinion = node.get("initial_opinion")
    init_loc = node.get("initial_level_of_care")
    init_effect = node.get("initial_effect_on_usage")
    initial_care = float(init_loc) * 10.0 if init_loc is not None else None
    initial_usage = int(init_effect) if init_effect is not None else None
    init_support = float(initial_usage) if initial_usage is not None else None
    
    return AgentProxy(
        id=agent_id,
        opinion=opinion,
        care=care,
        change_in_support=change_in_support,
        initial_opinion=str(init_opinion) if init_opinion is not None else None,
        initial_care=initial_care,
        initial_change_in_support=init_support,
        usage_effect=change_in_support,
        initial_usage_effect=init_support,
    )


def save_simulation(trigger_event, num_agents, initial_graph, post_trigger_graph, final_graph, summary_text=""):
    """
    Save simulation to database AND file backup
    
    Args:
        trigger_event: The event message
        num_agents: Number of agents
        initial_graph: Initial graph dict with nodes/edges
        post_trigger_graph: Post-trigger graph dict
        final_graph: Final graph dict
        summary_text: Optional supervisor summary
    
    Returns:
        SimulationRun database object
    """
    # Create simulation run in database
    simulation = SimulationRun.objects.create(
        trigger_event=trigger_event,
        num_agents=num_agents,
        status='running'
    )
    
    try:
        # Save agent states from all three stages
        for agent in initial_graph.get("nodes", []):
            AgentState.objects.create(
                simulation=simulation,
                agent_id=str(agent.get('agent_id', agent.get('id', ''))),
                stage='initial',
                archetype=agent.get('archetype'),
                sentiment=agent.get('sentiment'),
                opinion=agent.get('opinion', agent.get('text_opinion', '')),
                data=agent
            )
        
        for agent in post_trigger_graph.get("nodes", []):
            AgentState.objects.create(
                simulation=simulation,
                agent_id=str(agent.get('agent_id', agent.get('id', ''))),
                stage='post_trigger',
                archetype=agent.get('archetype'),
                sentiment=agent.get('sentiment'),
                opinion=agent.get('opinion', agent.get('text_opinion', '')),
                data=agent
            )
        
        for agent in final_graph.get("nodes", []):
            AgentState.objects.create(
                simulation=simulation,
                agent_id=str(agent.get('agent_id', agent.get('id', ''))),
                stage='final',
                archetype=agent.get('archetype'),
                sentiment=agent.get('sentiment'),
                opinion=agent.get('opinion', agent.get('text_opinion', '')),
                data=agent
            )
        
        # Save network snapshot (use edges from final graph)
        NetworkSnapshot.objects.create(
            simulation=simulation,
            stage='final',
            adjacency_matrix=final_graph.get('edges', [])
        )
        
        # Save summary if provided
        if summary_text:
            SimulationSummary.objects.create(
                simulation=simulation,
                summary_text=summary_text
            )
        
        # Mark as completed
        simulation.status = 'completed'
        simulation.completed_at = timezone.now()
        simulation.save()
        
        # Also save to file as backup
        try:
            sim_id = str(simulation.id)
            path = _simulations_dir() / f"{sim_id}.json"
            with open(path, "w", encoding="utf-8") as f:
                json.dump({
                    "trigger": trigger_event,
                    "agents": final_graph.get("nodes", [])
                }, f, indent=2)
        except OSError:
            pass  # File backup is optional
        
        print(f"✅ Simulation {simulation.id} saved to database!")
        return simulation
        
    except Exception as e:
        simulation.status = 'failed'
        simulation.save()
        print(f"❌ Error saving simulation: {e}")
        raise


def get_agents(simulation_id: str) -> tuple[list[AgentProxy], str] | None:
    """
    Retrieve agents from database for report generation
    
    Args:
        simulation_id: ID of simulation (database ID or string)
    
    Returns:
        (agents, trigger) tuple or None if not found
    """
    try:
        # Try as database ID
        sim_id = int(simulation_id)
        simulation = SimulationRun.objects.get(id=sim_id)
        
        # Get final agent states
        final_agents = simulation.agent_states.filter(stage='final')
        agents = [_node_to_agent_proxy(agent.data) for agent in final_agents]
        
        return agents, simulation.trigger_event
        
    except (ValueError, SimulationRun.DoesNotExist):
        # Fallback to file-based storage for old simulations
        try:
            path = _simulations_dir() / f"{simulation_id}.json"
            if path.exists():
                with open(path, encoding="utf-8") as f:
                    entry = json.load(f)
                agents = [_node_to_agent_proxy(a) for a in entry["agents"]]
                return agents, entry["trigger"]
        except (OSError, json.JSONDecodeError):
            pass
        
        return None


def get_simulation_results(simulation_id: int) -> dict:
    """
    Retrieve complete simulation results from database
    
    Args:
        simulation_id: Database ID of simulation
    
    Returns:
        Dictionary with all simulation data
    """
    simulation = SimulationRun.objects.get(id=simulation_id)
    
    return {
        'id': simulation.id,
        'trigger_event': simulation.trigger_event,
        'num_agents': simulation.num_agents,
        'status': simulation.status,
        'created_at': simulation.created_at,
        'completed_at': simulation.completed_at,
        'initial_agents': list(simulation.agent_states.filter(stage='initial').values()),
        'post_trigger_agents': list(simulation.agent_states.filter(stage='post_trigger').values()),
        'final_agents': list(simulation.agent_states.filter(stage='final').values()),
        'network': simulation.network_snapshots.filter(stage='final').first().adjacency_matrix if simulation.network_snapshots.filter(stage='final').exists() else [],
        'summary': simulation.summary.summary_text if hasattr(simulation, 'summary') else None
    }

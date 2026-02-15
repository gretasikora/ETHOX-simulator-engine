# main.py
"""Run full simulation and optionally export files. Use run_full_simulation() for API."""
from pathlib import Path

from config import NUM_AGENTS, TRIGGER_EVENT_MESSAGE
from simulation.interaction import supervisor_summarize
from simulation.network import visualize_adjacency_matrix
from simulation.runner import run_full_simulation

from backend.data.generate_network_from_simulation import export_network_json

if __name__ == "__main__":
    # Run full simulation (LLM calls)
    initial, _post_trigger, final, agents, adjacency = run_full_simulation(TRIGGER_EVENT_MESSAGE, NUM_AGENTS)

    # Export network for backend/website
    backend_data = Path(__file__).parent / "backend" / "data"
    export_network_json(agents, adjacency, backend_data / "network.json")

    # Generate supervisor summary
    summary = supervisor_summarize(agents, TRIGGER_EVENT_MESSAGE, include_initial=True)
    
    print("\n" + "="*80)
    print("SUPERVISOR SUMMARY")
    print("="*80)
    print(summary)
    print("="*80)

    print("\nDONE")

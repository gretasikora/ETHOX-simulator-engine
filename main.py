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
    initial, final, agents, adjacency = run_full_simulation(TRIGGER_EVENT_MESSAGE, NUM_AGENTS)

    # Export network for backend/website
    backend_data = Path(__file__).parent / "backend" / "data"
    export_network_json(agents, adjacency, backend_data / "network.json")

    out_dir = Path("simulation") / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    labels = {i: str(a.id) for i, a in enumerate(agents)}
    visualize_adjacency_matrix(adjacency, out_dir / "network.png", labels=labels)

    # Generate supervisor summary
    print("\n" + "=" * 80)
    print("SUPERVISOR SUMMARY")
    print("=" * 80)
    summary = supervisor_summarize(agents, TRIGGER_EVENT_MESSAGE, include_initial=True)
    print(summary)
    print("=" * 80)

    with open(out_dir / "supervisor_summary.txt", "w") as f:
        f.write(f"Event: {TRIGGER_EVENT_MESSAGE}\n\n")
        f.write(summary)

    print("\nDONE")

# Simulation

Load agents from JSON, compute connection scores between all pairs, write adjacency matrix.

- **main.py** – entry point
- **agents.py** – load/parse agents from JSON
- **connection.py** – connection score and adjacency matrix
- **data/sample_agents.json** – sample input

Run from repo root: `python simulation/main.py`  
Or from this folder: `python main.py`

Output: `simulation/outputs/adjacency_matrix.csv`

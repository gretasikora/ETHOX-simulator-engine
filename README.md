# ETHOX Simulator Engine

LLM-driven multi-agent simulation that blends synthetic BFI-2 personality traits with real-world shopping behavior data to model how opinions change after a market event.

## Quickstart

### 1) Create and activate a virtual environment

Windows (PowerShell):
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
python -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies
```bash
pip install -r requirements.txt
```

### 3) Set your OpenAI API key

Windows (PowerShell):
```powershell
$env:OPENAI_API_KEY="your-key-here"
```

macOS/Linux:
```bash
export OPENAI_API_KEY="your-key-here"
```

### 4) Run the simulation
```bash
python main.py
```

You should see LLM prompts in stdout and a generated network image at:
`simulation/outputs/network.png`.

## Repository structure (actual)

```
ETHOX-simulator-engine/
|-- main.py                      # Entry point
|-- config.py                    # Global settings
|-- requirements.txt             # Python dependencies
|-- agents/
|   |-- agent.py                 # Agent state
|-- llm/
|   |-- client.py                # OpenAI Responses API wrapper
|-- simulation/
|   |-- init_network.py          # Agent initialization from datasets + traits
|   |-- network.py               # Similarity graph + visualization
|   |-- interaction.py           # Trigger reaction + opinion update prompts
|   |-- outputs/                 # Generated artifacts (network.png)
|-- personalities/
|   |-- sampling.py              # BFI-2 trait synthesis
|   |-- calculate_demographics.py# Gender/age ratios from dataset
|-- datasets/
|   |-- Amazon Customer Behavior Survey.csv
```

## How it works (methods)

### 1) Agent initialization
`simulation/init_network.py` samples `NUM_AGENTS` rows from
`datasets/Amazon Customer Behavior Survey.csv` and pairs each row with a
synthetic BFI-2 personality profile (15 facets).

### 2) Personality synthesis
`personalities/sampling.py` builds correlated trait vectors using published
BFI-2 facet correlations and demographic effects. If a local `BFI2.csv`
exists, it will be used; otherwise, synthetic training data is generated.

### 3) Network construction
`simulation/network.py`:
- Standardizes traits, applies a whitening transform, and computes
  similarity via an RBF kernel.
- Samples each agent's degree from an exponential distribution driven by
  extroversion facets (Sociability, Assertiveness, Energy Level).
- Builds a weighted adjacency matrix and saves a visualization to
  `simulation/outputs/network.png`.

### 4) Opinion dynamics
`simulation/interaction.py`:
- LLM generates each agent's initial reaction to `TRIGGER_EVENT_MESSAGE`.
- Each agent updates their opinion based on neighbor opinions, weighted by
  similarity and a trait-based influencibility score.

## Configuration
Edit `config.py`:
- `NUM_AGENTS`: number of agents (default 20)
- `SEED`: random seed for reproducibility
- `MODEL`, `MAX_TOKENS`, `TEMPERATURE`: LLM settings
- `TRIGGER_EVENT_MESSAGE`: the market event prompt

## Outputs
- `simulation/outputs/network.png`: network visualization
- Stdout: prompt text and opinion updates

## Limitations (current)
- Single trigger event with one opinion update pass
- No persistence of multi-round interactions
- No evaluation metrics or calibration
- No UI or analytics dashboard

## Next steps (ideas)
- Multi-round influence cycles
- Agent-to-agent ratings and memory integration
- Metrics for opinion drift and polarization
- Calibration against real-world signals

## Data notes
- Amazon dataset is bundled under `datasets/`.
- Optional: place `BFI2.csv` in the repo root to use real BFI-2 data; otherwise
  synthetic training data is generated automatically.

# ETHOX Simulator Engine

A multi-agent simulation system that predicts how diverse voter segments interpret and respond to policy narratives, using AI-powered agents with realistic personality profiles and political behaviors.

## What It Does

This system simulates how different voters react to political messaging about policy issues. It:

- **Creates a diverse virtual electorate** with 20 simulated voters based on real survey data from 350 voters, each with unique personality traits (BFI-2 psychological model), demographics, political values, trust levels, and media habits
- **Tests policy message reception** by having each agent interpret a policy narrative through their own lens of personality, values, and beliefs
- **Models social influence** through a network where agents with similar personalities influence each other's interpretations, mimicking real-world opinion dynamics
- **Identifies communication vulnerabilities** by producing detailed reports on:
  - What different voter segments think the policy actually means
  - Where misunderstandings cluster and what phrases trigger them
  - Engagement levels across demographic groups
  - Support/opposition distribution across the electorate
  - Whether interpretations polarize or converge after social influence

**Use Case:** Policy narrative testing and misinformation resilience analysis for communication strategists, policymakers, and researchers who need to predict message reception before public release.

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
|-- main.py                      # Entry point: runs full simulation pipeline
|-- config.py                    # Global settings (agent count, LLM config, policy narrative)
|-- requirements.txt             # Python dependencies
|-- agents/
|   |-- agent.py                 # Agent state (traits, voter_profile, opinion, care, change_in_support)
|-- llm/
|   |-- client.py                # OpenAI chat completions API wrapper
|-- simulation/
|   |-- init_network.py          # Agent initialization from voter survey + synthetic traits
|   |-- network.py               # Personality similarity graph + visualization
|   |-- interaction.py           # Opinion formation and social influence prompts
|   |-- outputs/                 # Generated artifacts (network.png, supervisor_summary.txt)
|-- personalities/
|   |-- sampling.py              # BFI-2 trait synthesis with demographic correlations
|   |-- calculate_demographics.py# Gender/age ratios from voter survey dataset
|-- datasets/
|   |-- voter_opinion_survey_350.csv  # Real voter demographic and political behavior data
```

## How it works (methods)

### 1) Agent initialization
`simulation/init_network.py` samples `NUM_AGENTS` rows from
`datasets/voter_opinion_survey_350.csv` and pairs each with a dynamically
generated BFI-2 personality profile (15 facets across 5 domains). Each agent
receives realistic voter demographics, political values, trust levels, media
diet preferences, and misinformation susceptibility scores.

### 2) Personality synthesis
`personalities/sampling.py` builds correlated trait vectors using published
BFI-2 facet correlations and demographic effects from the voter survey.
Synthetic personalities are generated using multivariate normal distributions
with gender-specific and age-specific covariance structures. Output is saved
to `synthetic_society_{NUM_AGENTS}.csv`.

### 3) Network construction
`simulation/network.py`:
- Standardizes personality traits and applies a whitening transform
- Computes pairwise similarity using an RBF kernel with Mahalanobis distance
- Samples each agent's degree from an exponential distribution weighted by
  extroversion facets (Sociability, Assertiveness, Energy Level)
- Builds a weighted adjacency matrix representing social influence potential
- Saves visualization to `simulation/outputs/network.png`

### 4) Opinion dynamics (two-stage process)

**Stage 1 - Initial Reaction:**
`simulation/interaction.py` uses GPT-4 to generate each agent's initial
interpretation of `TRIGGER_EVENT_MESSAGE` based on their personality traits
and voter profile. Each agent produces:
- `opinion`: their interpretation of what the policy means or does
- `care`: engagement level (0-10 scale)
- `change_in_support`: support impact (-5 to +5 scale)

**Stage 2 - Social Influence:**
Each agent updates their opinion based on neighbor opinions, weighted by:
- Personality similarity (from the network)
- Trait-based influencibility score (computed from openness, agreeableness,
  and neuroticism facets)

### 5) Analysis output
A supervisor agent (GPT-4) analyzes all final opinions to produce a
comprehensive report including:
- Top perceived meanings across voter segments
- Care and support distributions
- Misunderstanding clusters and trigger phrases
- Polarization patterns and consensus levels
- Comparison of initial vs. post-influence interpretations

Results are saved to `simulation/outputs/supervisor_summary.txt`.

## Configuration
Edit `config.py`:
- `NUM_AGENTS`: number of simulated voters (default: 20)
- `SEED`: random seed for reproducibility (default: 42)
- `MODEL`: LLM for agents (default: "gpt-4o-mini")
- `SUPERVISOR_MODEL`: LLM for analysis (default: "gpt-4o")
- `MAX_TOKENS`: response length limit (default: 200)
- `TEMPERATURE`: LLM creativity parameter (default: 0.4)
- `TRIGGER_EVENT_MESSAGE`: the policy narrative to test

## Outputs

After running `python main.py`, you'll find:
- `simulation/outputs/network.png` - Social network visualization showing agent connections
- `simulation/outputs/supervisor_summary.txt` - Detailed analysis report
- `synthetic_society_20.csv` - Generated personality profiles for the 20 agents
- Console output showing individual agent interpretations and support scores

## Key Concepts

**BFI-2 Personality Model:** 15 facets across 5 domains (Extraversion, Agreeableness, Conscientiousness, Negative Emotionality, Open-Mindedness) measured on 1-5 scales

**Voter Profile:** Real survey data including age group, gender, region, education, income, political archetype, turnout likelihood, institutional trust, media diet, and misinformation susceptibility

**Social Influence Network:** Agents with similar personalities are more likely to be connected and influence each other's interpretations

**Change in Support:** Metric ranging from -5 (strongly oppose) to +5 (strongly support) measuring policy impact on voter behavior
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

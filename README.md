# Agentic Society — Minimal Multi-Agent Simulation Engine

This repository contains a **minimal, deterministic skeleton** for building and testing a multi-agent, LLM-driven social simulation.

The goal is to model how opinions, reactions, and network structure emerge when agents:

* have persistent memory,
* interact pairwise over time,
* experience an external “trigger” event,
* and update beliefs under social influence.

This is intentionally **barebones**. No graphs, no analytics, no visualizations yet. The focus is on **correct control flow, state mutation, and prompt wiring** before adding complexity.

---

## High-level idea

We simulate a small society of agents (default: 20) where:

1. Agents are initialized with slightly different personalities.
2. They talk to each other in random pairwise conversations over multiple rounds.
3. Each agent forms opinions (initially implicit, later explicit via ratings).
4. A trigger event occurs (e.g. “price doubled”).
5. Agents react individually.
6. Agents continue interacting, potentially influencing each other.
7. Post-event opinions are compared to pre-event opinions.

Right now, this repo covers **steps 1–2** (warm-up interactions). Rating, triggers, and network construction come later.

---

## Repository structure

```
agentic-society/
├── main.py                    # Entry point, runs the simulation loop
├── config.py                  # Global configuration (single source of truth)
├── requirements.txt           # Python dependencies
├── AGENTS.md                  # Quick reference for future agents
├── agents/
│   └── agent.py               # Agent state (traits + memory)
├── llm/
│   └── client.py              # LLM client wrapper
├── simulation/
│   ├── agents.py              # Agent utilities
│   ├── connection.py          # Connection/network utilities
│   ├── interaction.py         # Pairwise interaction logic + prompts
│   ├── init_network.py        # Agent initialization
│   └── json_to_matrix.py      # JSON to adjacency matrix conversion
├── personalities/
│   └── sampling.py            # BFI-2 personality sampling (200 agents)
```

Design principle: **each file has one job**. No file should “know” more than it needs to.

---

## Design principles (important)

* **Stub before API**
  The LLM client is intentionally fake at first. You must be able to run the entire loop without external dependencies.

* **State over cleverness**
  Agents only store traits and short memory. No hidden magic.

* **Deterministic first**
  Fixed seeds and hardcoded traits make debugging tractable.

* **Validate flow before features**
  If prompts, memory updates, or turn-taking are wrong, nothing else matters.

---

## How it works (current state)

### Agents

Each agent has:

* an `id`
* a small trait dictionary
* a per-agent memory map (agent_id -> summary)

No decision logic lives in the agent class.

### Interactions

* Two agents are randomly sampled each round.
* They have a 10â€“20 turn back-and-forth conversation.
* Each agent summarizes their impression of the other and stores it in memory.

### LLM client

Currently a stub:

```python
def llm_generate(prompt):
    print(prompt)
    return "Hello, I think things are fine."
```

This lets you:

* inspect prompts,
* test memory updates,
* validate the interaction loop.

---

## Running the simulation

### Setup

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On macOS/Linux
   # .venv\Scripts\activate   # On Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY='your-key-here'
   ```

### Run the main simulation

From the repo root:

```bash
python main.py
```

Note: personality traits are generated at startup using `personalities/sampling.py`, which downloads the open BFI-2 dataset from CRAN. Ensure your environment has network access and the dependencies in `requirements.txt`.

You should see:

* prompts printed to stdout,
* repeated interactions,
* no errors.

If this doesn't work, **do not move on**.

### Generate synthetic personalities

The [personalities/sampling.py](personalities/sampling.py) file generates 200 synthetic agent personalities based on the **BFI-2 (Big Five Inventory-2)** personality framework. It uses:

* **Demographic conditioning**: Gender (female/male) and age groups (Under 18, 18-40, 40+)
* **Psychometric data**: Correlations and means from Soto & John (2017)
* **Real or synthetic BFI-2 data**: Auto-generates realistic training data if real dataset unavailable using gender patterns and the maturity principle
* **Multivariate sampling**: Generates correlated personality facet scores (15 facets across 5 domains)

**Generate the synthetic society:**

```bash
python personalities/sampling.py
```

This will:
1. Try to download the real BFI-2 dataset from CRAN (may fail due to encoding issues)
2. **Automatically fall back** to generating realistic synthetic training data
3. Fit age-effect models for each personality facet
4. Generate 200 synthetic individuals with realistic personality distributions
5. Save results to `synthetic_society_200.csv`

**Optional: Use real BFI-2 data**

If you have R and want to use the real dataset instead of synthetic training data:

```r
# In R console:
install.packages('ShinyItemAnalysis')
library(ShinyItemAnalysis)
data('BFI2')
write.csv(BFI2, 'BFI2.csv', row.names=FALSE)
```

Place `BFI2.csv` in your project root, then run the script.

**Output format:**
- `gender`: female/male
- `age_group`: Under 18, 18-40, or 40+
- 15 facet columns: Sociability, Assertiveness, Energy Level, Compassion, Respectfulness, Trust, Organization, Productiveness, Responsibility, Anxiety, Depression, Emotional Volatility, Intellectual Curiosity, Aesthetic Sensitivity, Creative Imagination
- All facet scores are on a 1–5 scale (clamped)

**Customization:**
Edit the demographic proportions in the `main()` function:
```python
p_gender = {"female": 0.55, "male": 0.45}
p_age = {"Under 18": 0.05, "18-40": 0.65, "40+": 0.30}
```

---

## Sanity check (mandatory)

After warm-up rounds, inspect agent memory:

```python
for a in agents[:3]:
    print(a.id, a.memory)
```

If:

* all agents have identical memories → something is wrong
* memories are empty → interaction loop is broken
* prompts look nonsensical → fix prompt construction first

---

## What is intentionally missing (for now)

* Agent-to-agent ratings
* Explicit opinion objects
* Trigger events
* Network / graph construction
* Analytics or plotting
* Optimization or performance work

Adding these too early will hide bugs.

---

## Planned next steps

Once the warm-up loop is solid:

1. Add **rating prompts** (agent → agent, agent → event).
2. Introduce a **trigger event** and capture initial reactions.
3. Run **post-event interaction rounds**.
4. Compare pre/post opinions.
5. Construct a weighted network graph from ratings.

Only after that:

* visualization,
* metrics,
* calibration,
* realism.

---

## Who this is for

* Hackathon projects exploring agentic behavior
* Research prototypes for social / economic simulations
* People who care about **mechanics before narratives**

This is not a product. It’s a **foundation**.

---

## Ground rules if you extend this

* Don’t add features without a testable hypothesis.
* Don’t touch visuals until behavior makes sense.
* Don’t trust “interesting outputs” without control experiments.

---

# Synthetic BFI-2 Data Generation

The script generates synthetic BFI-2 data with:
- Realistic age and gender distributions
- Research-backed demographic effects:
  - Women score higher on Agreeableness and Negative Emotionality facets
  - Men score slightly higher on Assertiveness
  - Older adults score higher on Agreeableness/Conscientiousness, lower on Negative Emotionality (maturity principle)

These effects are based on:
- Soto & John (2017), Table 5 (gender means/SDs)
- General Big Five literature (maturity principle)
- Russian BFI-2 invariance study (age/sex effects)

**No R or external data required.**

To generate and check the data:
```bash
python personalities/sampling.py
python test_demographics.py  # Shows group differences
```

See the script for details on the effect sizes and implementation.

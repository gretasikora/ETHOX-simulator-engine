# AGENTS

Quick project notes for future agents working in this repo.

## Run
- Set OPENAI_API_KEY in your environment.
- Run: python main.py

## Config
- Global settings live in config.py (model, tokens, temperature, rounds, seed).

## Structure
- agents/: Agent class and state.
- llm/: LLM client wrapper.
- simulation/: Optional JSON -> adjacency matrix pipeline (see simulation/README.md).

## Notes
- Keep prompts short and deterministic when testing.
- Avoid changing seeds unless needed for experiments.
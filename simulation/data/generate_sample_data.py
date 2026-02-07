#!/usr/bin/env python3
"""
Generate synthetic agent JSON for testing the adjacency-matrix pipeline.
Usage: python generate_sample_data.py [--count 50] [--out sample_agents_large.json]
"""

import argparse
import json
import random
from pathlib import Path

ARCHETYPES = [
    ("early_adopter", 0.2, 0.8, 0.85, 0.6),   # low price_sens, high loyalty, high social, high influence
    ("value_seeker", 0.9, 0.35, 0.25, 0.3),
    ("follower", 0.5, 0.6, 0.55, 0.5),
    ("loyalist", 0.4, 0.95, 0.5, 0.55),
    ("skeptic", 0.7, 0.3, 0.4, 0.35),
    ("champion", 0.25, 0.9, 0.9, 0.88),
    ("bargain_hunter", 0.95, 0.25, 0.35, 0.3),
    ("neutral", 0.5, 0.5, 0.5, 0.5),
]
# archetype -> (price_sensitivity_base, loyalty_base, social_influence_base, influence_score_base)


def generate_agents(n: int, seed: int = 42) -> list[dict]:
    random.seed(seed)
    agents = []
    for i in range(1, n + 1):
        arch = random.choice(ARCHETYPES)
        name, ps, ly, si, inf = arch
        # Add some variance (±0.15)
        jitter = lambda x, d=0.15: max(0.0, min(1.0, x + random.uniform(-d, d)))
        sentiment = random.uniform(-0.8, 0.8)
        agents.append({
            "id": i,
            "archetype": name,
            "traits": {
                "price_sensitivity": round(jitter(ps), 3),
                "loyalty": round(jitter(ly), 3),
                "social_influence": round(jitter(si), 3),
            },
            "state": {"sentiment": round(sentiment, 3), "active": random.random() > 0.1},
            "memory": [],
            "neighbors": [],
            "influence_score": round(jitter(inf), 3),
        })
    return agents


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate synthetic agents JSON.")
    ap.add_argument("--count", type=int, default=50, help="Number of agents (default 50)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed")
    ap.add_argument("--out", default="sample_agents_large.json", help="Output filename")
    args = ap.parse_args()

    out_path = Path(__file__).parent / args.out
    agents = generate_agents(args.count, seed=args.seed)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(agents, f, indent=2)
    print(f"Wrote {len(agents)} agents to {out_path}")


if __name__ == "__main__":
    main()

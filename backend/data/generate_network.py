"""
One-off script to generate backend/data/network.json.
Run from backend/: python data/generate_network.py
"""
import json
import random
from pathlib import Path

random.seed(42)
N = 40
GENDERS = ["male", "female"]
AGE_MIN, AGE_MAX = 18, 80
# Fake opinions for testing level_of_care / effect_on_usage / text_opinion
FAKE_OPINIONS = [
    "I think this product is useful for daily tasks.",
    "Not sure yet—need to try it longer.",
    "Helps me stay organized; would recommend.",
    "A bit expensive but the quality is good.",
    "Wish it had better support for my use case.",
]
TRAIT_KEYS = [
    "spending", "loyalty", "social_influence", "risk_tolerance",
    "price_sensitivity", "tech_adoption", "impulsiveness", "environmental_consciousness",
]

nodes = []
for i in range(N):
    traits = {}
    for k in TRAIT_KEYS:
        traits[k] = round(min(1.0, max(0.0, random.uniform(0.2, 0.8) + random.uniform(-0.1, 0.1))), 4)
    nodes.append({
        "agent_id": f"agent_{i}",
        "degree": 0,
        "traits": traits,
        "degree_centrality": round(random.uniform(0.01, 0.5), 4),
        "betweenness_centrality": round(random.uniform(0.0, 0.3), 4),
        "age": random.randint(AGE_MIN, AGE_MAX),
        "gender": random.choice(GENDERS),
        "level_of_care": random.randint(0, 10),
        "effect_on_usage": random.randint(-5, 5),
        "text_opinion": random.choice(FAKE_OPINIONS),
    })

edges = []
edge_set = set()
for _ in range(120):
    i = random.randint(0, N - 1)
    j = random.randint(0, N - 1)
    if i == j:
        continue
    if i > j:
        i, j = j, i
    key = (i, j)
    if key not in edge_set:
        edge_set.add(key)
        edges.append({
            "source": f"agent_{i}",
            "target": f"agent_{j}",
            "weight": round(random.uniform(0.3, 1.0), 4),
        })

# Ensure every node has at least one edge
degree = [0] * N
for e in edges:
    i = int(e["source"].split("_")[1])
    j = int(e["target"].split("_")[1])
    degree[i] += 1
    degree[j] += 1
for i in range(N):
    if degree[i] == 0:
        j = (i + 1) % N
        key = (min(i, j), max(i, j))
        if key not in edge_set:
            edge_set.add(key)
            edges.append({"source": f"agent_{i}", "target": f"agent_{j}", "weight": round(random.uniform(0.3, 1.0), 4)})
            degree[i] += 1
            degree[j] += 1

for i in range(N):
    nodes[i]["degree"] = degree[i]

out = Path(__file__).parent / "network.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump({"nodes": nodes, "edges": edges}, f, indent=2)
print("Wrote", out)

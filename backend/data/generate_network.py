"""
One-off script to generate backend/data/network.json.
Run from backend/: python data/generate_network.py
"""
import json
import random
from pathlib import Path

random.seed(42)
N = 40
CLUSTER_RANGES = [(0, 8), (8, 16), (16, 24), (24, 32), (32, 40)]
GENDERS = ["male", "female", "non_binary", "unknown"]
AGE_MIN, AGE_MAX = 18, 80
TRAIT_KEYS = [
    "spending", "loyalty", "social_influence", "risk_tolerance",
    "price_sensitivity", "tech_adoption", "impulsiveness", "environmental_consciousness",
]
# Cluster biases: cluster 0 higher spending/lower price_sensitivity, etc.
CLUSTER_BIAS = {
    0: {"spending": 0.2, "price_sensitivity": -0.2},
    1: {"loyalty": 0.2, "social_influence": 0.1},
    2: {"risk_tolerance": 0.2, "tech_adoption": 0.15},
    3: {"impulsiveness": 0.15, "environmental_consciousness": -0.1},
    4: {"environmental_consciousness": 0.2, "spending": -0.1},
}

def cluster_for(i):
    for c, (a, b) in enumerate(CLUSTER_RANGES):
        if a <= i < b:
            return c
    return 0

nodes = []
for i in range(N):
    c = cluster_for(i)
    traits = {}
    for k in TRAIT_KEYS:
        base = random.uniform(0.2, 0.8)
        bias = CLUSTER_BIAS.get(c, {}).get(k, 0)
        traits[k] = round(min(1.0, max(0.0, base + bias + random.uniform(-0.1, 0.1))), 4)
    nodes.append({
        "agent_id": f"agent_{i}",
        "degree": 0,
        "cluster": c,
        "traits": traits,
        "degree_centrality": round(random.uniform(0.01, 0.5), 4),
        "betweenness_centrality": round(random.uniform(0.0, 0.3), 4),
        "age": random.randint(AGE_MIN, AGE_MAX),
        "gender": random.choice(GENDERS),
    })

edges = []
edge_set = set()
# Within-cluster edges (~80%)
for _ in range(96):
    c = random.randint(0, 4)
    a, b = CLUSTER_RANGES[c]
    i = random.randint(a, b - 1) if b > a + 1 else a
    j = random.randint(a, b - 1) if b > a + 1 else a
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
# Cross-cluster (~24)
for _ in range(30):
    c1, c2 = random.sample(range(5), 2)
    a1, b1 = CLUSTER_RANGES[c1]
    a2, b2 = CLUSTER_RANGES[c2]
    i = random.randint(a1, b1 - 1)
    j = random.randint(a2, b2 - 1)
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
        c = cluster_for(i)
        a, b = CLUSTER_RANGES[c]
        j = random.randint(a, b - 1) if b > a else a
        if j == i:
            j = (i + 1) % b if b > a + 1 else (a + 1) % N
        j = max(a, min(b - 1, j))
        if j == i:
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

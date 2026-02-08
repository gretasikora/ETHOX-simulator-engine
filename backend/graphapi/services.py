import json
from pathlib import Path

from django.conf import settings

_cache = {"data": None, "mtime": None}


def load_graph():
    path = settings.DATA_DIR / "network.json"
    if not path.exists():
        return {"nodes": [], "edges": []}

    mtime = path.stat().st_mtime
    if _cache["data"] is not None and _cache["mtime"] == mtime:
        return _cache["data"]

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    if "nodes" not in data or not isinstance(data["nodes"], list):
        data["nodes"] = []
    if "edges" not in data or not isinstance(data["edges"], list):
        data["edges"] = []

    for node in data["nodes"]:
        node["agent_id"] = str(node.get("agent_id", ""))
        if "traits" not in node or not isinstance(node["traits"], dict):
            node["traits"] = {}

    for edge in data["edges"]:
        edge["source"] = str(edge.get("source", ""))
        edge["target"] = str(edge.get("target", ""))
        if edge.get("weight") is None:
            edge["weight"] = 1.0
        else:
            edge["weight"] = float(edge["weight"])

    _cache["data"] = data
    _cache["mtime"] = mtime
    return data


def clear_cache():
    _cache["data"] = None
    _cache["mtime"] = None


def get_metadata(graph):
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    trait_keys_set = set()
    for node in nodes:
        traits = node.get("traits") or {}
        trait_keys_set.update(traits.keys())
    trait_keys = sorted(trait_keys_set)

    return {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "trait_keys": trait_keys,
    }


def get_node_detail(graph, agent_id):
    agent_id = str(agent_id)
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    node = None
    for n in nodes:
        if str(n.get("agent_id")) == agent_id:
            node = n
            break
    if node is None:
        return None

    neighbors = []
    for edge in edges:
        src, tgt = str(edge["source"]), str(edge["target"])
        if src != agent_id and tgt != agent_id:
            continue
        other_id = tgt if src == agent_id else src
        weight = edge.get("weight", 1.0)
        other_node = None
        for n in nodes:
            if str(n.get("agent_id")) == other_id:
                other_node = n
                break
        if other_node is not None:
            neighbors.append({
                "agent_id": other_id,
                "weight": weight,
                "degree": other_node.get("degree", 0),
            })

    return {"node": node, "neighbors": neighbors}

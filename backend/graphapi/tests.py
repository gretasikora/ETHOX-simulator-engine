import json
import tempfile
from pathlib import Path

from django.test import TestCase, override_settings
from django.conf import settings

from .services import clear_cache


def make_minimal_graph():
    return {
        "nodes": [
            {"agent_id": "agent_0", "degree": 2, "traits": {"spending": 0.5}, "degree_centrality": 0.1, "betweenness_centrality": 0.01},
            {"agent_id": "agent_1", "degree": 1, "traits": {"spending": 0.6}, "degree_centrality": 0.05, "betweenness_centrality": 0.0},
        ],
        "edges": [
            {"source": "agent_0", "target": "agent_1", "weight": 0.8},
        ],
    }


@override_settings(DATA_DIR=Path(tempfile.gettempdir()) / "societyviz_test_data")
class TestGraphEndpoint(TestCase):
    def setUp(self):
        self.data_dir = settings.DATA_DIR
        self.data_dir.mkdir(parents=True, exist_ok=True)
        path = self.data_dir / "network.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(make_minimal_graph(), f, indent=2)
        clear_cache()

    def test_get_graph(self):
        response = self.client.get("/api/graph/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("nodes", data)
        self.assertIn("edges", data)
        self.assertIn("metadata", data)
        self.assertEqual(len(data["nodes"]), 2)
        self.assertEqual(len(data["edges"]), 1)
        self.assertEqual(data["metadata"]["node_count"], 2)
        self.assertEqual(data["metadata"]["edge_count"], 1)

    def test_get_node(self):
        response = self.client.get("/api/nodes/agent_0/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("node", data)
        self.assertIn("neighbors", data)
        self.assertEqual(data["node"]["agent_id"], "agent_0")
        self.assertEqual(len(data["neighbors"]), 1)
        self.assertEqual(data["neighbors"][0]["agent_id"], "agent_1")

    def test_get_node_404(self):
        response = self.client.get("/api/nodes/nonexistent/")
        self.assertEqual(response.status_code, 404)

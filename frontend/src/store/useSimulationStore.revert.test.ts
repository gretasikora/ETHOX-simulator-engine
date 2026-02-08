/**
 * Tests for revertToDefault: after a simulation run, Revert should restore
 * the initial graph in the graph store and set viewMode to default, phase to pre_trigger.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RunSimulationResponse } from "../api/client";

const mockSimulationResponse = vi.hoisted(() => ({
  simulation_id: "test-sim-1",
  initial_graph: {
    nodes: [
      {
        agent_id: 1,
        degree: 2,
        traits: { openness: 0.5 },
        degree_centrality: 0.1,
        betweenness_centrality: 0,
      },
      {
        agent_id: 2,
        degree: 1,
        traits: { openness: 0.3 },
        degree_centrality: 0.05,
        betweenness_centrality: 0,
      },
    ],
    edges: [{ source: 1, target: 2, weight: 1 }],
  },
  post_trigger_graph: {
    nodes: [
      { agent_id: 1, degree: 2, traits: {}, degree_centrality: 0.1, betweenness_centrality: 0 },
      { agent_id: 2, degree: 1, traits: {}, degree_centrality: 0.05, betweenness_centrality: 0 },
    ],
    edges: [{ source: 1, target: 2, weight: 1 }],
  },
  final_graph: {
    nodes: [
      { agent_id: 1, degree: 2, traits: {}, degree_centrality: 0.1, betweenness_centrality: 0 },
      { agent_id: 2, degree: 1, traits: {}, degree_centrality: 0.05, betweenness_centrality: 0 },
    ],
    edges: [{ source: 1, target: 2, weight: 1 }],
  },
} satisfies RunSimulationResponse));

vi.mock("../api/client", () => ({
  runSimulation: vi.fn().mockResolvedValue(mockSimulationResponse),
  fetchSimulationReport: vi.fn(),
}));

import { useSimulationStore } from "./useSimulationStore";
import { useGraphStore } from "./useGraphStore";
import { useUIStore } from "./useUIStore";

describe("revertToDefault", () => {
  beforeEach(() => {
    useSimulationStore.getState().reset();
    useGraphStore.getState().setGraphData([], []);
    useUIStore.getState().setSizeBy("level_of_care");
  });

  it("restores initial graph and sets viewMode/phase when initialGraph exists", async () => {
    const { runSimulation, revertToDefault } = useSimulationStore.getState();

    await runSimulation("test trigger", 10);

    const initialNodes = useSimulationStore.getState().initialGraph!.nodes;
    const initialEdges = useSimulationStore.getState().initialGraph!.edges;

    useGraphStore.getState().setGraphData(
      [{ agent_id: "99", degree: 0, traits: {}, degree_centrality: 0, betweenness_centrality: 0 }],
      []
    );
    useUIStore.getState().setSizeBy("level_of_care");

    await revertToDefault();

    expect(useGraphStore.getState().nodes).toHaveLength(initialNodes.length);
    expect(useGraphStore.getState().nodes.map((n) => n.agent_id)).toEqual(initialNodes.map((n) => n.agent_id));
    expect(useGraphStore.getState().edges).toHaveLength(initialEdges.length);
    expect(useUIStore.getState().sizeBy).toBe("level_of_care");
    expect(useSimulationStore.getState().viewMode).toBe("default");
    expect(useSimulationStore.getState().phase).toBe("pre_trigger");
  });

  it("calls loadGraph when initialGraph is null and sets viewMode/phase", async () => {
    useSimulationStore.getState().reset();
    expect(useSimulationStore.getState().initialGraph).toBeNull();

    const loadGraphSpy = vi.spyOn(useGraphStore.getState(), "loadGraph").mockResolvedValue();

    await useSimulationStore.getState().revertToDefault();

    expect(loadGraphSpy).toHaveBeenCalled();
    expect(useSimulationStore.getState().viewMode).toBe("default");
    expect(useSimulationStore.getState().phase).toBe("pre_trigger");
  });
});

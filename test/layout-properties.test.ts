import { describe, it, expect } from "vitest";
import { verticalLayout } from "../src/layout";
import { createGraphSnapshot } from "../src/model";

describe("Layout Properties", () => {
  it("Order Invariance: Output layout is completely independent of the insertion order of nodes and edges", () => {
    // Generate a non-trivial graph setup
    const nodes = [
      { id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }
    ];
    const edges = [
      { id: "e1", source: "A", target: "B" },
      { id: "e2", source: "A", target: "C" },
      { id: "e3", source: "B", target: "D" },
      { id: "e4", source: "C", target: "D" },
      { id: "e5", source: "C", target: "E" }
    ];

    // Forward insertion order
    const snap1 = createGraphSnapshot({
      nodes: [...nodes],
      edges: [...edges]
    });

    // Reverse insertion order
    const snap2 = createGraphSnapshot({
      nodes: [...nodes].reverse(),
      edges: [...edges].reverse()
    });

    // Random insertion order (shuffled deterministically for the test)
    const snap3 = createGraphSnapshot({
      nodes: [nodes[2], nodes[4], nodes[0], nodes[1], nodes[3]],
      edges: [edges[3], edges[1], edges[4], edges[0], edges[2]]
    });

    const layout1 = verticalLayout(snap1);
    const layout2 = verticalLayout(snap2);
    const layout3 = verticalLayout(snap3);

    // Bounding boxes should match exactly
    expect(layout1.width).toBe(layout2.width);
    expect(layout1.height).toBe(layout2.height);
    expect(layout1.width).toBe(layout3.width);
    expect(layout1.height).toBe(layout3.height);

    // Node positions should match exactly
    for (const { id } of nodes) {
      expect(layout1.positions.get(id)).toEqual(layout2.positions.get(id));
      expect(layout1.positions.get(id)).toEqual(layout3.positions.get(id));
    }
  });

  it("Node Dimensions Monotonicity: Increasing individual node dimensions monotonically increases overall layout bounds", () => {
    const snap = createGraphSnapshot({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      edges: [{ id: "e1", source: "A", target: "B" }, { id: "e2", source: "A", target: "C" }]
    });

    const baseLayout = verticalLayout(snap, { nodeWidth: 100, nodeHeight: 50 });
    const widerLayout = verticalLayout(snap, { nodeWidth: 200, nodeHeight: 50 });
    const tallerLayout = verticalLayout(snap, { nodeWidth: 100, nodeHeight: 100 });

    expect(widerLayout.width).toBeGreaterThan(baseLayout.width);
    // Height should be same or greater
    expect(widerLayout.height).toBeGreaterThanOrEqual(baseLayout.height);

    expect(tallerLayout.height).toBeGreaterThan(baseLayout.height);
    // Width should be same or greater
    expect(tallerLayout.width).toBeGreaterThanOrEqual(baseLayout.width);
  });
});

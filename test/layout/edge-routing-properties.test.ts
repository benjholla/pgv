import { describe, it, expect } from "vitest";
import { verticalLayout, edgeEndpoints } from "../../src/layout";
import { createGraphSnapshot, GraphSnapshotJson } from "../../src/model";

describe("Edge Routing Properties", () => {
  it("Edge Staggering Property: Multiple edges between the same two nodes must take visually distinct paths", () => {
    // According to the layout's multigraph properties, multiple edges between A and B
    // should be routed so they don't perfectly overlap, using routing hints.
    const json: GraphSnapshotJson = {
      nodes: [{ id: "A" }, { id: "B" }],
      edges: [
        { id: "e1", source: "A", target: "B" },
        { id: "e2", source: "A", target: "B" },
        { id: "e3", source: "A", target: "B" }
      ]
    };

    const graph = createGraphSnapshot(json);
    const layout = verticalLayout(graph);

    const path1 = edgeEndpoints(graph.edges.get("e1")!, layout)!.path;
    const path2 = edgeEndpoints(graph.edges.get("e2")!, layout)!.path;
    const path3 = edgeEndpoints(graph.edges.get("e3")!, layout)!.path;

    // The paths should not be exactly equal
    expect(path1).not.toEqual(path2);
    expect(path1).not.toEqual(path3);
    expect(path2).not.toEqual(path3);

    // They should share the exact same start and end points in terms of connection logic,
    // but the `edgeEndpoints` applies offsets to the *actual* geometric start/end points.
    // So the very first/last coordinates will differ.
    expect(path1[0].x).not.toEqual(path2[0].x);
    expect(path1[path1.length - 1].x).not.toEqual(path2[path2.length - 1].x);
  });

  it("Self-Loop Property: Layout can route edges that connect a node to itself", () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "A" }],
      edges: [
        { id: "e1", source: "A", target: "A" }
      ]
    };

    const graph = createGraphSnapshot(json);
    const layout = verticalLayout(graph);

    const edge = graph.edges.get("e1")!;
    const endpoints = edgeEndpoints(edge, layout);
    expect(endpoints).not.toBeNull();
    // Path should have multiple points to form a loop, not just a line with length 0
    expect(endpoints!.path.length).toBeGreaterThan(2);
  });

  it("Routing Determinism: Identical inputs always produce the exact same orthogonal path", () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      edges: [
        { id: "e1", source: "A", target: "B" },
        { id: "e2", source: "B", target: "C" },
        { id: "e3", source: "A", target: "C" }
      ]
    };

    const graph = createGraphSnapshot(json);
    const layout1 = verticalLayout(graph);
    const layout2 = verticalLayout(graph);

    const edge = graph.edges.get("e3")!;
    const path1 = edgeEndpoints(edge, layout1)!.path;
    const path2 = edgeEndpoints(edge, layout2)!.path;

    expect(path1).toEqual(path2);
  });
});

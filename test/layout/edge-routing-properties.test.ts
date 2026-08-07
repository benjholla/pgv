import { describe, it, expect } from "vitest";
import { verticalLayout, edgeEndpoints, routeEdgeOrthogonal } from "../../src/layout";
import { createGraphSnapshot, GraphSnapshotJson } from "../../src/model";

describe("Edge Routing Properties", () => {
  it("Overlapping Obstacles Boundary: Layout routes correctly when obstacles geometrically overlap", () => {
    const sourcePt = { x: 0, y: 0 };
    const targetPt = { x: 200, y: 200 };

    // Create obstacles that overlap, forming a larger combined obstacle
    const obstacleLayout = {
      positions: new Map([
        ["obs1", { x: 50, y: 50 }],
        ["obs2", { x: 80, y: 80 }]
      ]),
      nodeSizes: new Map([
        ["obs1", { width: 60, height: 60 }], // Right edge is 110, bottom is 110
        ["obs2", { width: 60, height: 60 }]  // Left edge is 80, top is 80
      ]),
      hierarchy: new Map(),
      nodeSize: { width: 100, height: 50 },
      width: 300,
      height: 300
    } as any;

    const path = routeEdgeOrthogonal(sourcePt, targetPt, obstacleLayout, 0, 0, 1, 1);

    // Path should successfully route without throwing
    expect(path.length).toBeGreaterThan(2);
    expect(path[0]).toEqual(sourcePt);
    expect(path[path.length - 1]).toEqual(targetPt);
  });

  it("High Degree Staggering Boundary: Layout elegantly handles mathematically extreme numbers of incoming/outgoing staggered edges", () => {
    const sourcePt = { x: 0, y: 0 };
    const targetPt = { x: 100, y: 200 };

    const emptyLayout = {
      positions: new Map(),
      nodeSizes: new Map(),
      hierarchy: new Map(),
      nodeSize: { width: 50, height: 50 },
      width: 500,
      height: 500
    } as any;

    // A wildly large number of edges
    const outTotal = 1000;
    const inTotal = 1000;

    // Test with outIndex outTotal - 1 to maximize the staggering offset
    const path = routeEdgeOrthogonal(
      sourcePt, targetPt, emptyLayout,
      outTotal - 1, inTotal - 1,
      outTotal, inTotal
    );

    // Path should route successfully and coordinates shouldn't blow up to Infinity/NaN
    expect(path.length).toBeGreaterThan(2);
    expect(path.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });

  it("Compound Node Traversal Property: Routing algorithm correctly permits crossing the boundary of a compound node", () => {
    // Tests that parent node boundaries don't act as solid barriers preventing edge connections to inner children
    const sourcePt = { x: 0, y: 0 }; // Outside
    const targetPt = { x: 100, y: 100 }; // Inside parent

    // Parent node completely encompasses the target
    const parentId = "parent";
    const layout = {
      positions: new Map([[parentId, { x: 50, y: 50 }]]),
      nodeSizes: new Map([[parentId, { width: 100, height: 100 }]]),
      hierarchy: new Map([[parentId, { children: ["childTarget"], parent: null }]]),
      nodeSize: { width: 100, height: 50 },
      width: 500,
      height: 500
    } as any;

    const path = routeEdgeOrthogonal(sourcePt, targetPt, layout);

    // It should route successfully straight through the parent
    expect(path.length).toBeGreaterThan(2);
    expect(path[0]).toEqual(sourcePt);
    expect(path[path.length - 1]).toEqual(targetPt);
  });

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

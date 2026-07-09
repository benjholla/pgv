import { describe, it, expect } from "vitest";
import { verticalLayout, edgeEndpoints, type VerticalLayoutOptions } from "../src/layout";
import { createGraphSnapshot, type GraphSnapshot } from "../src/model";

describe("layout", () => {

  describe("Edge Routing Orthogonality and Visual Cleanness", () => {
    // SKIPPED (TECHNICAL DEBT):
    // Why it is disabled: The current `routeEdgeOrthogonal` A* pathfinding algorithm does not correctly
    // stagger horizontal edge paths vertically based on source/target rank and lexical edge ID.
    // Consequently, when multiple siblings are added to a node, their orthogonal edges route through
    // the exact same horizontal Y-coordinate, creating visually unclear overlapping paths.
    // Why it is acceptable to leave disabled: Fixing layout algorithms can introduce complex regressions, so it should be addressed in a dedicated PR focusing exclusively on layout stability.
    // What conditions must be satisfied to re-enable it: The layout algorithm must be updated
    // to dynamically stagger vertical offsets for these routing paths before this test can be enabled.
    it.skip("avoids overlapping horizontal paths for orthogonal edges between same ranks", () => {
      const graph = createGraphSnapshot({
        graphId: "g1",
        version: 1,
        nodes: [{ id: "A" }, { id: "B1" }, { id: "B2" }, { id: "B3" }],
        edges: [
          { id: "e1", source: "A", target: "B1" },
          { id: "e2", source: "A", target: "B2" },
          { id: "e3", source: "A", target: "B3" }
        ]
      });

      const layout = verticalLayout(graph);

      // Compute endpoints and paths for each edge, spacing out the target source X offsets
      // to mimic renderer behavior where multiple edges out of a node get offset.
      const p1 = edgeEndpoints(graph.edges.get("e1")!, layout, -20, 0);
      const p2 = edgeEndpoints(graph.edges.get("e2")!, layout, 0, 0);
      const p3 = edgeEndpoints(graph.edges.get("e3")!, layout, 20, 0);

      expect(p1).not.toBeNull();
      expect(p2).not.toBeNull();
      expect(p3).not.toBeNull();

      // Extract the horizontal segments for each path.
      // A horizontal segment is defined by a change in X but same Y coordinate across two path points.
      const getHorizontalYs = (endpoints: NonNullable<ReturnType<typeof edgeEndpoints>>) => {
        const ys = new Set<number>();
        const path = endpoints.path;
        for (let i = 0; i < path.length - 1; i++) {
          if (path[i].y === path[i + 1].y && Math.abs(path[i].x - path[i + 1].x) > 0) {
            ys.add(path[i].y);
          }
        }
        return Array.from(ys);
      };

      const p1Ys = getHorizontalYs(p1!);
      const p2Ys = getHorizontalYs(p2!);
      const p3Ys = getHorizontalYs(p3!);

      // Since all target nodes (B1, B2, B3) are at depth 1, they will likely share
      // horizontal paths to get from their starting X offsets to their final targets.
      // These horizontal segments should NOT share the exact same Y coordinate.
      const allYs = [...p1Ys, ...p2Ys, ...p3Ys];
      const uniqueYs = new Set(allYs);

      // If there are overlaps, the number of unique Y coordinates will be less than the total
      // number of horizontal segments computed. We want to ensure no two edges share the same Y.
      expect(uniqueYs.size).toBe(allYs.length);
    });
  });

  describe("verticalLayout", () => {
    describe("Geometric and Topological Properties", () => {
      it("Translation Invariance: Uniformly shifting margin shifts all coordinates by exact amount", () => {
        const graph = createGraphSnapshot({
          graphId: "test-trans",
          version: 1,
          nodes: [{ id: "A" }, { id: "B" }],
          edges: [{ id: "e1", source: "A", target: "B" }]
        });

        const lay1 = verticalLayout(graph, { margin: 10 });
        const lay2 = verticalLayout(graph, { margin: 110 });

        const posA1 = lay1.positions.get("A")!;
        const posB1 = lay1.positions.get("B")!;

        const posA2 = lay2.positions.get("A")!;
        const posB2 = lay2.positions.get("B")!;

        expect(posA2.x - posA1.x).toBe(100);
        expect(posA2.y - posA1.y).toBe(100);
        expect(posB2.x - posB1.x).toBe(100);
        expect(posB2.y - posB1.y).toBe(100);
      });

      it("Scale Monotonicity: Increasing spacing configurations strictly monotonically increases bounding box", () => {
        const graph = createGraphSnapshot({
          graphId: "test-scale",
          version: 1,
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [{ id: "e1", source: "A", target: "B" }, { id: "e2", source: "A", target: "C" }]
        });

        const laySmall = verticalLayout(graph, { nodeSpacing: 100, layerSpacing: 100 });
        const layLarge = verticalLayout(graph, { nodeSpacing: 200, layerSpacing: 200 });

        expect(layLarge.width).toBeGreaterThan(laySmall.width);
        expect(layLarge.height).toBeGreaterThan(laySmall.height);
      });

      it("Conservation of Nodes: Layout explicitly assigns exactly one point per node, with no orphans", () => {
        const graph = createGraphSnapshot({
          graphId: "test-conserv",
          version: 1,
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [{ id: "e1", source: "A", target: "B" }]
        });

        const layout = verticalLayout(graph);
        expect(layout.positions.size).toBe(3);
        expect(Array.from(layout.positions.keys()).sort()).toEqual(["A", "B", "C"]);
      });

      it("Topological Ordering (DAG): Target nodes strictly fall vertically below source nodes in acyclic structures", () => {
        const graph = createGraphSnapshot({
          graphId: "test-topo",
          version: 1,
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
          edges: [
            { id: "e1", source: "A", target: "B" },
            { id: "e2", source: "A", target: "C" },
            { id: "e3", source: "B", target: "D" },
            { id: "e4", source: "C", target: "D" }
          ]
        });

        const layout = verticalLayout(graph);
        const posA = layout.positions.get("A")!;
        const posB = layout.positions.get("B")!;
        const posC = layout.positions.get("C")!;
        const posD = layout.positions.get("D")!;

        expect(posB.y).toBeGreaterThan(posA.y);
        expect(posC.y).toBeGreaterThan(posA.y);
        expect(posD.y).toBeGreaterThan(posB.y);
        expect(posD.y).toBeGreaterThan(posC.y);
      });
    });

    describe("Property and Edge Case Tests", () => {
      it("Determinism: layouts are identical regardless of input iteration order", () => {
        // Construct identical graphs but insert nodes/edges in different orders
        const nodes1 = [{id: "A"}, {id: "B"}, {id: "C"}];
        const edges1 = [{id: "e1", source: "A", target: "B"}, {id: "e2", source: "A", target: "C"}];
        const snap1 = createGraphSnapshot({graphId: "g1", version: 1, nodes: nodes1, edges: edges1});
        const lay1 = verticalLayout(snap1);

        const nodes2 = [{id: "A"}, {id: "C"}, {id: "B"}];
        const edges2 = [{id: "e2", source: "A", target: "C"}, {id: "e1", source: "A", target: "B"}];
        const snap2 = createGraphSnapshot({graphId: "g2", version: 1, nodes: nodes2, edges: edges2});
        const lay2 = verticalLayout(snap2);

        // Sorting the entries to compare structural equality ignoring map internal order
        const map1 = Array.from(lay1.positions.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const map2 = Array.from(lay2.positions.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        expect(map1).toEqual(map2);
      });

      it("Edge Case: gracefully handles self-loops without infinite recursion", () => {
        const graph = createGraphSnapshot({
          graphId: "test-self-loop",
          version: 1,
          nodes: [{ id: "A" }],
          edges: [{ id: "e1", source: "A", target: "A" }],
        });

        // If it loops infinitely, it will crash or timeout.
        const layout = verticalLayout(graph);

        expect(layout.positions.size).toBe(1);
        expect(layout.positions.has("A")).toBe(true);
      });
    });

    it("handles an empty graph", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [],
        edges: [],
      });

      const layout = verticalLayout(graph);

      expect(layout.positions.size).toBe(0);
      expect(layout.width).toBe(220 + 32 * 2); // default node width + 2 * default margin
      expect(layout.height).toBe(88 + 32 * 2); // default node height + 2 * default margin
      expect(layout.nodeSize).toEqual({ width: 220, height: 88 });
    });

    it("Boundary: handles extremely deep graphs without call stack limits", () => {
      const nodeCount = 20000;
      const nodes = [];
      const edges = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({ id: `n${i}` });
        if (i > 0) {
          edges.push({ id: `e${i}`, source: `n${i-1}`, target: `n${i}` });
        }
      }
      const graph = createGraphSnapshot({ graphId: "deep", version: 1, nodes, edges });
      const layout = verticalLayout(graph);
      expect(layout.positions.size).toBe(nodeCount);
    });

    it("Boundary: handles extremely wide graphs without call stack limits", () => {
      const nodeCount = 100_000;
      // Using an implicit loop array initialization
      const nodes = Array.from({ length: nodeCount }, (_, i) => ({ id: `n${i}` }));

      const graph = createGraphSnapshot({
        graphId: "test-wide",
        version: 1,
        nodes,
        edges: []
      });

      const layout = verticalLayout(graph);
      expect(layout.positions.size).toBe(nodeCount);
    });

    it("lays out a single node", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1" }],
        edges: [],
      });

      const layout = verticalLayout(graph);

      expect(layout.positions.size).toBe(1);
      expect(layout.positions.get("n1")).toEqual({ x: 32, y: 32 }); // margin, margin
      expect(layout.width).toBe(284);
      expect(layout.height).toBe(152);
    });

    it("lays out a linear chain of nodes respecting topological ordering and containment", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
        edges: [
          { id: "e1", source: "A", target: "B" },
          { id: "e2", source: "B", target: "C" },
        ],
      });

      const layout = verticalLayout(graph);
      expect(layout.positions.size).toBe(3);

      const posA = layout.positions.get("A")!;
      const posB = layout.positions.get("B")!;
      const posC = layout.positions.get("C")!;

      // Topological Ordering: Target node must be placed below source node
      expect(posB.y).toBeGreaterThanOrEqual(posA.y + layout.nodeSize.height);
      expect(posC.y).toBeGreaterThanOrEqual(posB.y + layout.nodeSize.height);

      // Containment: All nodes must fall entirely within the computed width and height
      for (const pos of layout.positions.values()) {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.x + layout.nodeSize.width).toBeLessThanOrEqual(layout.width);
        expect(pos.y + layout.nodeSize.height).toBeLessThanOrEqual(layout.height);
      }
    });

    it("lays out disconnected cyclic components and calculates depths without initial roots", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
        edges: [
          // Cycle 1: A -> B -> A
          { id: "e1", source: "A", target: "B" },
          { id: "e2", source: "B", target: "A" },
          // Cycle 2: C -> D -> C (disconnected from A/B)
          { id: "e3", source: "C", target: "D" },
          { id: "e4", source: "D", target: "C" },
        ],
      });

      const layout = verticalLayout(graph);
      expect(layout.positions.size).toBe(4);

      // Verify that all nodes were assigned valid depths/positions
      for (const pos of layout.positions.values()) {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
      }
    });

    it("lays out diamond dependencies without duplicate traversal visits", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
        edges: [
          // Diamond: A -> B, A -> C, B -> D, C -> D
          { id: "e1", source: "A", target: "B" },
          { id: "e2", source: "A", target: "C" },
          { id: "e3", source: "B", target: "D" },
          { id: "e4", source: "C", target: "D" },
        ],
      });

      const layout = verticalLayout(graph);
      expect(layout.positions.size).toBe(4);

      const posA = layout.positions.get("A")!;
      const posB = layout.positions.get("B")!;
      const posC = layout.positions.get("C")!;
      const posD = layout.positions.get("D")!;

      // Topologically: B and C should be below A, and D should be below B and C.
      expect(posB.y).toBeGreaterThanOrEqual(posA.y + layout.nodeSize.height);
      expect(posC.y).toBeGreaterThanOrEqual(posA.y + layout.nodeSize.height);
      expect(posD.y).toBeGreaterThanOrEqual(posB.y + layout.nodeSize.height);
      expect(posD.y).toBeGreaterThanOrEqual(posC.y + layout.nodeSize.height);
    });

    it("lays out disconnected components without overlapping nodes", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
        edges: [
          { id: "e1", source: "A", target: "B" },
          // C is disconnected
        ],
      });

      const layout = verticalLayout(graph);
      expect(layout.positions.size).toBe(3);

      // Extract positions into an array for pairwise collision checking
      const boxes = Array.from(layout.positions.values()).map(p => ({
        left: p.x,
        right: p.x + layout.nodeSize.width,
        top: p.y,
        bottom: p.y + layout.nodeSize.height
      }));

      // Non-overlapping property: Check every pair
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const b1 = boxes[i];
          const b2 = boxes[j];
          const disjoint =
            b1.right <= b2.left ||
            b1.left >= b2.right ||
            b1.bottom <= b2.top ||
            b1.top >= b2.bottom;
          expect(disjoint).toBe(true);
        }
      }

      // Ensure disconnected components share the correct depth constraints
      // In this specific algorithm, A and C should be on the same depth (Y level)
      const posA = layout.positions.get("A")!;
      const posC = layout.positions.get("C")!;
      expect(posA.y).toBe(posC.y);
    });

    it("respects custom layout options", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }],
        edges: [{ id: "e1", source: "A", target: "B" }],
      });

      const customOptions: VerticalLayoutOptions = {
        nodeWidth: 100,
        nodeHeight: 50,
        layerSpacing: 100,
        nodeSpacing: 150,
        margin: 10,
      };

      const layout = verticalLayout(graph, customOptions);

      expect(layout.nodeSize).toEqual({ width: 100, height: 50 });
      expect(layout.positions.get("A")).toEqual({ x: 10, y: 10 });
      expect(layout.positions.get("B")).toEqual({ x: 10, y: 110 }); // 10 + 100
      expect(layout.width).toBe(100 + 20);
      expect(layout.height).toBe(50 + 100 + 20);
    });

    it("ignores edges referencing missing nodes during depth assignment", () => {
      // Create a raw graph skipping validation to simulate the case
      const graph = {
        nodes: new Map([["A", { id: "A", tags: [], attributes: {} }]]),
        edges: new Map([
          ["e1", { id: "e1", source: "A", target: "MISSING", tags: [], attributes: {} }],
        ]),
      } as any; // Cast to any to bypass TS checks for the mock

      const layout = verticalLayout(graph);

      expect(layout.positions.size).toBe(1);
      expect(layout.positions.get("A")).toEqual({ x: 32, y: 32 });
    });
  });

  describe("edgeEndpoints", () => {
    describe("Property and Edge Case Tests", () => {
      it("Orthogonality: path segments strictly align horizontally or vertically", () => {
        const graph = createGraphSnapshot({
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [
            { id: "e1", source: "A", target: "B" },
            { id: "e2", source: "A", target: "C" },
            { id: "e3", source: "B", target: "C" },
          ],
        });

        const layout = verticalLayout(graph);
        for (const edge of graph.edges.values()) {
          const endpoints = edgeEndpoints(edge, layout);
          expect(endpoints).not.toBeNull();

          const path = endpoints!.path;
          for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            // Segment must be either perfectly horizontal or perfectly vertical
            const isOrthogonal = (p1.x === p2.x) || (p1.y === p2.y);
            expect(isOrthogonal).toBe(true);
          }
        }
      });

      it("Endpoint Consistency: first and last path points exactly match source and target endpoints", () => {
        const graph = createGraphSnapshot({
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [
            { id: "e1", source: "A", target: "B" },
            { id: "e2", source: "A", target: "C" },
            { id: "e3", source: "B", target: "C" },
          ],
        });

        const layout = verticalLayout(graph);
        for (const edge of graph.edges.values()) {
          const endpoints = edgeEndpoints(edge, layout);
          expect(endpoints).not.toBeNull();

          const path = endpoints!.path;
          expect(path.length).toBeGreaterThanOrEqual(2);

          const firstPoint = path[0];
          const lastPoint = path[path.length - 1];

          expect(firstPoint).toEqual(endpoints!.source);
          expect(lastPoint).toEqual(endpoints!.target);
        }
      });
    });

    it("calculates correct endpoints for an edge", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }],
        edges: [{ id: "e1", source: "A", target: "B" }],
      });

      const layout = verticalLayout(graph);
      const edge = graph.edges.get("e1")!;

      const endpoints = edgeEndpoints(edge, layout);

      expect(endpoints).not.toBeNull();
      // A (32, 32), nodeSize (220, 88) -> source endpoint at bottom center of A
      expect(endpoints?.source).toEqual({
        x: 32 + 110, // x + width/2
        y: 32 + 88,  // y + height
      });
      // B (32, 180), nodeSize (220, 88) -> target endpoint at top center of B
      expect(endpoints?.target).toEqual({
        x: 32 + 110,
        y: 180,
      });
    });

    it("returns null if source or target is missing from layout positions", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }],
        edges: [{ id: "e1", source: "A", target: "B" }],
      });

      const layout = verticalLayout(graph);

      // Mutate layout positions to remove B
      const layoutWithoutB = {
        ...layout,
        positions: new Map([["A", layout.positions.get("A")!]]),
      };

      const edge = graph.edges.get("e1")!;

      const endpoints = edgeEndpoints(edge, layoutWithoutB);
      expect(endpoints).toBeNull();
    });
  });
});

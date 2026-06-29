import { describe, it, expect } from "vitest";
import { verticalLayout, edgeEndpoints, type VerticalLayoutOptions } from "../src/layout";
import { createGraphSnapshot, type GraphSnapshot } from "../src/model";

describe("layout", () => {
  describe("verticalLayout", () => {
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

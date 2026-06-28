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

    it("lays out a linear chain of nodes", () => {
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
      expect(layout.positions.get("A")).toEqual({ x: 32, y: 32 });
      expect(layout.positions.get("B")).toEqual({ x: 32, y: 32 + 148 }); // margin + layerSpacing
      expect(layout.positions.get("C")).toEqual({ x: 32, y: 32 + 148 * 2 });

      expect(layout.width).toBe(284);
      expect(layout.height).toBe(88 + 148 * 2 + 64);
    });

    it("lays out disconnected components", () => {
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

      // Depth 0: A and C
      // Max layer size: 2 -> Max width: 220 + 1 * 280 = 500
      // Margin 32
      // Layer width for depth 0: 500
      // startX: 32 + (500 - 500)/2 = 32
      expect(layout.positions.get("A")?.x).toBe(32);
      expect(layout.positions.get("C")?.x).toBe(32 + 280); // startX + 1 * nodeSpacing
      expect(layout.positions.get("A")?.y).toBe(32);
      expect(layout.positions.get("C")?.y).toBe(32);

      // Depth 1: B
      // Layer width for depth 1: 220
      // startX: 32 + (500 - 220)/2 = 32 + 140 = 172
      expect(layout.positions.get("B")?.x).toBe(172);
      expect(layout.positions.get("B")?.y).toBe(32 + 148);

      expect(layout.width).toBe(500 + 64); // maxLayerWidth + 2 * margin
      expect(layout.height).toBe(88 + 148 + 64); // nodeHeight + 1 * layerSpacing + 2 * margin
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

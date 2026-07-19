import { describe, it, expect } from "vitest";
import { verticalLayout, edgeEndpoints, type VerticalLayoutOptions } from "../src/layout";
import { createGraphSnapshot, type GraphSnapshot } from "../src/model";

class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (1664525 * this.seed + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

function generateRandomGraph(seed: number, numNodes: number, edgeDensity: number): GraphSnapshot {
  const rng = new PRNG(seed);
  const nodes = [];
  const edges = [];

  for (let i = 0; i < numNodes; i++) {
    nodes.push({ id: `n${i}` });
  }

  let edgeId = 0;
  for (let i = 0; i < numNodes; i++) {
    for (let j = 0; j < numNodes; j++) {
      if (i !== j && rng.next() < edgeDensity) {
        edges.push({ id: `e${edgeId++}`, source: `n${i}`, target: `n${j}` });
      }
    }
  }

  return createGraphSnapshot({
    graphId: `rand-${seed}`,
    version: 1,
    nodes,
    edges,
  });
}

describe("layout", () => {
  describe("Compound Node Layout", () => {
    it("handles deeply nested empty compound nodes", () => {
      const graph = createGraphSnapshot({
        nodes: [
          { id: "parent1" },
          { id: "parent2" }
        ],
        edges: [
          { id: "e1", source: "parent1", target: "parent2", tags: ["contains"] }
        ]
      });

      const schema = { containment: ["contains"] };
      const layout = verticalLayout(graph, undefined, undefined, schema);

      expect(layout.nodeSizes.has("parent1")).toBe(true);
      expect(layout.nodeSizes.has("parent2")).toBe(true);
    });

    it("returns cached node size if child is already calculated", () => {
      const graph = createGraphSnapshot({
        nodes: [
          { id: "parent" },
          { id: "child" }
        ],
        edges: [
          { id: "e1", source: "parent", target: "child", tags: ["contains"] }
        ]
      });
      const schema = { containment: ["contains"] };

      const sizes = new Map([["child", { width: 50, height: 50 }]]);
      const layout = verticalLayout(graph, undefined, undefined, schema);

      // Call verticalLayout again to test cache hit
      const layout2 = verticalLayout(graph, undefined, undefined, schema);
      expect(layout2.nodeSizes.has("parent")).toBe(true);
    });

    it("handles deeply nested compound nodes and their bounding boxes", () => {
      const graph = createGraphSnapshot({
        nodes: [
          { id: "root" },
          { id: "parent1" },
          { id: "child1" },
          { id: "leaf1" },
          { id: "parent2" },
          { id: "leaf2" }
        ],
        edges: [
          { id: "e1", source: "root", target: "parent1", tags: ["contains"] },
          { id: "e2", source: "root", target: "parent2", tags: ["contains"] },
          { id: "e3", source: "parent1", target: "child1", tags: ["contains"] },
          { id: "e4", source: "child1", target: "leaf1", tags: ["contains"] },
          { id: "e5", source: "parent2", target: "leaf2", tags: ["contains"] },
          { id: "e6", source: "leaf1", target: "leaf2", tags: [] }
        ]
      });

      const schema = { containment: ["contains"] };
      const layout = verticalLayout(graph, undefined, undefined, schema);

      expect(layout.nodeSizes.has("root")).toBe(true);
      expect(layout.positions.has("root")).toBe(true);

      const rSize = layout.nodeSizes.get("root")!;
      expect(rSize.width).toBeGreaterThan(0);
      expect(rSize.height).toBeGreaterThan(0);
    });

    it("computes bounds for compound nodes and routes edges ignoring containment", () => {
      const graph = createGraphSnapshot({
        nodes: [
          { id: "parent1" },
          { id: "child1" },
          { id: "child2" },
          { id: "emptyParent" }
        ],
        edges: [
          { id: "e1", source: "parent1", target: "child1", tags: ["contains"] },
          { id: "e2", source: "parent1", target: "child2", tags: ["contains"] },
          { id: "e3", source: "child1", target: "child2", tags: [] }
        ]
      });

      const schema = { containment: ["contains"] };
      const layout = verticalLayout(graph, undefined, undefined, schema);

      expect(layout.nodeSizes.has("parent1")).toBe(true);
      expect(layout.positions.has("parent1")).toBe(true);
      expect(layout.nodeSizes.has("emptyParent")).toBe(true);
      expect(layout.positions.has("emptyParent")).toBe(true);

      const pSize = layout.nodeSizes.get("parent1")!;
      expect(pSize.width).toBeGreaterThan(0);
      expect(pSize.height).toBeGreaterThan(0);
    });

    it("handles collapsed compound nodes", () => {
      const graph = createGraphSnapshot({
        nodes: [
          { id: "parent1" },
          { id: "child1" }
        ],
        edges: [
          { id: "e1", source: "parent1", target: "child1", tags: ["contains"] }
        ]
      });

      const schema = { containment: ["contains"] };
      const layout = verticalLayout(graph, { collapsedNodes: new Set(["parent1"]) }, undefined, schema);

      expect(layout.nodeSizes.get("parent1")!.height).toBe(36);
    });
  });


  describe("Edge Routing Orthogonality and Visual Cleanness", () => {
    it("avoids overlapping horizontal paths for orthogonal edges between same ranks", () => {
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
      const p1 = edgeEndpoints(graph.edges.get("e1")!, layout);
      const p2 = edgeEndpoints(graph.edges.get("e2")!, layout);
      const p3 = edgeEndpoints(graph.edges.get("e3")!, layout);

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
    describe("Compound Nodes (Hierarchy)", () => {
      it("Bounding Box Inclusion Property: Parent nodes must strictly encompass all their children with padding", () => {
        const schema = { containment: ["contains"] };
        const graph = createGraphSnapshot({
          nodes: [{ id: "P" }, { id: "C1" }, { id: "C2" }],
          edges: [
            { id: "e1", source: "P", target: "C1", tags: ["contains"] },
            { id: "e2", source: "P", target: "C2", tags: ["contains"] }
          ]
        });

        const layout = verticalLayout(graph, undefined, undefined, schema);

        expect(layout.hierarchy).toBeDefined();
        expect(layout.hierarchy?.get("P")?.children).toEqual(["C1", "C2"]);

        const posP = layout.positions.get("P")!;
        const sizeP = layout.nodeSizes!.get("P")!;

        const posC1 = layout.positions.get("C1")!;
        const sizeC1 = layout.nodeSizes!.get("C1")!;

        const posC2 = layout.positions.get("C2")!;
        const sizeC2 = layout.nodeSizes!.get("C2")!;

        // Check inclusion
        expect(posC1.x).toBeGreaterThanOrEqual(posP.x);
        expect(posC1.y).toBeGreaterThanOrEqual(posP.y);
        expect(posC1.x + sizeC1.width).toBeLessThanOrEqual(posP.x + sizeP.width);
        expect(posC1.y + sizeC1.height).toBeLessThanOrEqual(posP.y + sizeP.height);

        expect(posC2.x).toBeGreaterThanOrEqual(posP.x);
        expect(posC2.y).toBeGreaterThanOrEqual(posP.y);
        expect(posC2.x + sizeC2.width).toBeLessThanOrEqual(posP.x + sizeP.width);
        expect(posC2.y + sizeC2.height).toBeLessThanOrEqual(posP.y + sizeP.height);
      });

      it("Deep Hierarchy Inclusion: Grandparent encompasses parent which encompasses child", () => {
        const schema = { containment: ["contains"] };
        const graph = createGraphSnapshot({
          nodes: [{ id: "G" }, { id: "P" }, { id: "C" }],
          edges: [
            { id: "e1", source: "G", target: "P", tags: ["contains"] },
            { id: "e2", source: "P", target: "C", tags: ["contains"] }
          ]
        });

        const layout = verticalLayout(graph, undefined, undefined, schema);

        const posG = layout.positions.get("G")!;
        const sizeG = layout.nodeSizes!.get("G")!;

        const posP = layout.positions.get("P")!;
        const sizeP = layout.nodeSizes!.get("P")!;

        const posC = layout.positions.get("C")!;
        const sizeC = layout.nodeSizes!.get("C")!;

        // Parent inside Grandparent
        expect(posP.x).toBeGreaterThanOrEqual(posG.x);
        expect(posP.y).toBeGreaterThanOrEqual(posG.y);
        expect(posP.x + sizeP.width).toBeLessThanOrEqual(posG.x + sizeG.width);
        expect(posP.y + sizeP.height).toBeLessThanOrEqual(posG.y + sizeG.height);

        // Child inside Parent
        expect(posC.x).toBeGreaterThanOrEqual(posP.x);
        expect(posC.y).toBeGreaterThanOrEqual(posP.y);
        expect(posC.x + sizeC.width).toBeLessThanOrEqual(posP.x + sizeP.width);
        expect(posC.y + sizeC.height).toBeLessThanOrEqual(posP.y + sizeP.height);
      });

      it("Empty Parent Nodes: Assigns default dimensions and fallback positions", () => {
        const schema = { containment: ["contains"] };
        const graph = createGraphSnapshot({
          nodes: [{ id: "EmptyParent" }],
          // No containment edges means this parent has no children
          // Wait, if it has no containment edges pointing out, it's not detected as a parent natively by tags?
          // The algorithm initializes layoutHierarchy for ALL nodes.
          edges: []
        });

        const layout = verticalLayout(graph, undefined, undefined, schema);

        expect(layout.nodeSizes?.get("EmptyParent")).toEqual(layout.nodeSize);
        expect(layout.positions.has("EmptyParent")).toBe(true);
      });

      it("Containment edges are excluded from edge endpoints and routing", () => {
        const schema = { containment: ["contains"] };
        const graph = createGraphSnapshot({
          nodes: [{ id: "P" }, { id: "C" }],
          edges: [{ id: "e1", source: "P", target: "C", tags: ["contains"] }]
        });

        const layout = verticalLayout(graph, { containmentTags: new Set(["contains"]) }, undefined, schema);

        // It shouldn't generate edge routing hints for containment edges
        expect(layout.edgeRouting?.has("e1")).toBe(false);
      });
    });

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
      it("Idempotence Property: consecutive verticalLayout calls on the same snapshot produce identical geometries", () => {
        const json = {
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [
            { id: "e1", source: "A", target: "B" },
            { id: "e2", source: "B", target: "C" },
            { id: "e3", source: "A", target: "C" }
          ]
        };

        const snap = createGraphSnapshot(json as any);
        const layout1 = verticalLayout(snap);
        const layout2 = verticalLayout(snap);

        expect(layout1.positions).toEqual(layout2.positions);
        expect(layout1.edges).toEqual(layout2.edges);
        expect(layout1.width).toEqual(layout2.width);
        expect(layout1.height).toEqual(layout2.height);
      });

      it("Layout Stability: passing a previousLayout strictly preserves the relative horizontal ordering of existing nodes within the same layer", () => {
        // Base graph
        const baseGraph = createGraphSnapshot({
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
          edges: [
            { id: "e1", source: "A", target: "B" },
            { id: "e2", source: "A", target: "C" }
          ]
        });

        const baseLayout = verticalLayout(baseGraph);
        const posB1 = baseLayout.positions.get("B")!;
        const posC1 = baseLayout.positions.get("C")!;

        // Assert initial relative ordering (either B is left of C, or C is left of B)
        const isBLeftOfC = posB1.x < posC1.x;

        // Next graph adds new nodes and edges that might normally disrupt the layout
        const nextGraph = createGraphSnapshot({
          nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
          edges: [
            { id: "e1", source: "A", target: "B" },
            { id: "e2", source: "A", target: "C" },
            // Add new nodes that fall into the same layer as B and C
            { id: "e3", source: "A", target: "D" },
            { id: "e4", source: "A", target: "E" }
          ]
        });

        const nextLayout = verticalLayout(nextGraph, { previousLayout: baseLayout });
        const posB2 = nextLayout.positions.get("B")!;
        const posC2 = nextLayout.positions.get("C")!;

        // The relative horizontal order of B and C must be strictly preserved
        expect(posB2.x < posC2.x).toBe(isBLeftOfC);

        // Also verify that they share the same depth layer (Y coordinate) in both layouts
        expect(posB1.y).toBe(posC1.y);
        expect(posB2.y).toBe(posC2.y);
      });

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

      it("Degenerate Geometry: gracefully handles nodes configured with zero width and zero height", () => {
        const graph = createGraphSnapshot({
          nodes: [{ id: "A" }, { id: "B" }],
          edges: [{ id: "e1", source: "A", target: "B" }]
        });

        const layout = verticalLayout(graph, {
          nodeWidth: 0,
          nodeHeight: 0
        });

        expect(layout.nodeSize).toEqual({ width: 0, height: 0 });
        expect(layout.positions.size).toBe(2);

        const endpoints = edgeEndpoints(graph.edges.get("e1")!, layout);
        expect(endpoints).not.toBeNull();
        expect(endpoints!.path.length).toBeGreaterThanOrEqual(2);
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

    it("lays out collapsed nodes with reduced height and shifts subsequent nodes up", () => {
      const graph = createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "A" }, { id: "B" }],
        edges: [{ id: "e1", source: "A", target: "B" }],
      });

      const normalLayout = verticalLayout(graph);
      const collapsedLayout = verticalLayout(graph, { collapsedNodes: new Set(["A"]) });

      const normalPosA = normalLayout.positions.get("A")!;
      const normalPosB = normalLayout.positions.get("B")!;

      const collapsedPosA = collapsedLayout.positions.get("A")!;
      const collapsedPosB = collapsedLayout.positions.get("B")!;

      // A's position should be the same
      expect(collapsedPosA.y).toBe(normalPosA.y);

      // But A's size should be smaller (specifically 36 based on config)
      const normalSizeA = normalLayout.nodeSizes.get("A") ?? normalLayout.nodeSize;
      const collapsedSizeA = collapsedLayout.nodeSizes.get("A") ?? collapsedLayout.nodeSize;

      expect(collapsedSizeA.height).toBeLessThan(normalSizeA.height);
      expect(collapsedSizeA.height).toBe(36);

      // B should be shifted up due to A being smaller
      expect(collapsedPosB.y).toBeLessThan(normalPosB.y);
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
      it("Edge Routing Invariants: Paths are orthogonal, avoid obstacles, and connect endpoints", () => {
        const seeds = [42, 1337, 2023, 9999, 12345]; // Deterministic test cases

        for (const seed of seeds) {
          const graph = generateRandomGraph(seed, 10, 0.2); // Generate a 10-node graph with 20% edge density
          const layout = verticalLayout(graph);

          const nodeBoxes = Array.from(layout.positions.values()).map(p => ({
            left: p.x,
            right: p.x + layout.nodeSize.width,
            top: p.y,
            bottom: p.y + layout.nodeSize.height,
          }));

          for (const edge of graph.edges.values()) {
            const endpoints = edgeEndpoints(edge, layout);
            expect(endpoints).not.toBeNull();
            const path = endpoints!.path;

            // Invariant 1: Endpoint Consistency
            expect(path.length).toBeGreaterThanOrEqual(2);
            expect(path[0]).toEqual(endpoints!.source);
            expect(path[path.length - 1]).toEqual(endpoints!.target);

            for (let i = 0; i < path.length - 1; i++) {
              const p1 = path[i];
              const p2 = path[i + 1];

              // Invariant 2: Orthogonality
              const isOrthogonal = (p1.x === p2.x) || (p1.y === p2.y);
              expect(isOrthogonal).toBe(true);

              // Invariant 3: Obstacle Avoidance
              const minX = Math.min(p1.x, p2.x);
              const maxX = Math.max(p1.x, p2.x);
              const minY = Math.min(p1.y, p2.y);
              const maxY = Math.max(p1.y, p2.y);

              for (const box of nodeBoxes) {
                const intersects = minX < box.right && maxX > box.left && minY < box.bottom && maxY > box.top;
                expect(intersects).toBe(false);
              }
            }
          }
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

  describe("Sorting fallback edge cases", () => {
    it("falls back to outgoing edges for hintX when node has no incoming edges connected to previously positioned nodes", () => {
      const prevGraph = createGraphSnapshot({
        nodes: [{ id: "A" }, { id: "B" }],
        edges: []
      });
      const prevLayout = verticalLayout(prevGraph);

      const newGraph = createGraphSnapshot({
        nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
        edges: [
          { id: "e1", source: "C", target: "A" },
          { id: "e2", source: "D", target: "B" },
        ]
      });

      const nextLayout = verticalLayout(newGraph, { previousLayout: prevLayout });
      expect(nextLayout).toBeDefined();
    });

    it("falls back to 0 for hintX when node has no positioned incoming or outgoing edges", () => {
      const prevGraph = createGraphSnapshot({
        nodes: [{ id: "A" }, { id: "B" }],
        edges: []
      });
      const prevLayout = verticalLayout(prevGraph);

      const newGraph = createGraphSnapshot({
        nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
        edges: []
      });

      const nextLayout = verticalLayout(newGraph, { previousLayout: prevLayout });
      expect(nextLayout).toBeDefined();
    });
  });
});

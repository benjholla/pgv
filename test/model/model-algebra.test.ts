import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson, invertGraphDiff, graphDiffToJson } from "../../src/model";

describe("Algebraic properties of applyGraphDiff", () => {
    it("Identity Property: Applying an empty diff preserves the graph identically", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "A" }],
            edges: []
        });

        const emptyDiff = createGraphDiff({
            addedNodes: [],
            addedEdges: [],
            removedNodes: [],
            removedEdges: []
        });

        const snap2 = applyGraphDiff(base, emptyDiff);

        expect(graphSnapshotToJson(snap2)).toEqual(graphSnapshotToJson(base));
        expect(snap2.nodes).toEqual(base.nodes);
        expect(snap2.edges).toEqual(base.edges);
        expect(snap2.schema).toEqual(base.schema);
    });

    it("Associativity Property: (Base + Diff1) + Diff2 === Base + (Diff1 + Diff2)", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "A" }],
            edges: []
        });

        const diff1 = createGraphDiff({
            addedNodes: [{ id: "B" }],
            addedEdges: [{ id: "e1", source: "A", target: "B" }]
        });

        const diff2 = createGraphDiff({
            addedNodes: [{ id: "C" }],
            addedEdges: [{ id: "e2", source: "B", target: "C" }]
        });

        const combinedDiff = createGraphDiff({
            addedNodes: [{ id: "B" }, { id: "C" }],
            addedEdges: [{ id: "e1", source: "A", target: "B" }, { id: "e2", source: "B", target: "C" }]
        });

        const leftSide = applyGraphDiff(applyGraphDiff(base, diff1), diff2);
        const rightSide = applyGraphDiff(base, combinedDiff);

        expect(graphSnapshotToJson(leftSide)).toEqual(graphSnapshotToJson(rightSide));
    });

    it("Commutativity: Independent diffs can be applied in any order with identical results", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }],
            edges: []
        });

        const diff1 = createGraphDiff({
            addedNodes: [{ id: "n2" }],
            addedEdges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        const diff2 = createGraphDiff({
            addedNodes: [{ id: "n3" }],
            addedEdges: [{ id: "e2", source: "n1", target: "n3" }]
        });

        const snap1 = applyGraphDiff(applyGraphDiff(base, diff1), diff2);
        const snap2 = applyGraphDiff(applyGraphDiff(base, diff2), diff1);

        const ids1 = Array.from(snap1.nodes.keys()).sort();
        const ids2 = Array.from(snap2.nodes.keys()).sort();
        expect(ids1).toEqual(ids2);

        const eids1 = Array.from(snap1.edges.keys()).sort();
        const eids2 = Array.from(snap2.edges.keys()).sort();
        expect(eids1).toEqual(eids2);
    });

    it("Commutativity with Removals: Independent diffs involving additions and removals can be applied in any order", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }, { id: "n2" }],
            edges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        // Diff1 adds new elements
        const diff1 = createGraphDiff({
            addedNodes: [{ id: "n3" }],
            addedEdges: [{ id: "e2", source: "n2", target: "n3" }]
        });

        // Diff2 removes existing elements (independent from Diff1)
        const diff2 = createGraphDiff({
            removedNodes: ["n1"],
            removedEdges: ["e1"]
        });

        const snap1 = applyGraphDiff(applyGraphDiff(base, diff1), diff2);
        const snap2 = applyGraphDiff(applyGraphDiff(base, diff2), diff1);

        expect(graphSnapshotToJson(snap1)).toEqual(graphSnapshotToJson(snap2));

        // Final state should contain exactly n2, n3, and e2
        expect(snap1.nodes.size).toBe(2);
        expect(snap1.nodes.has("n2")).toBe(true);
        expect(snap1.nodes.has("n3")).toBe(true);
        expect(snap1.edges.size).toBe(1);
        expect(snap1.edges.has("e2")).toBe(true);
    });


    it("Replacement Property: Safely replace an element in a single diff without duplicate ID errors", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1", tags: ["old"] }],
            edges: []
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            addedNodes: [{ id: "n1", tags: ["new"] }]
        });

        const snap = applyGraphDiff(base, diff);

        expect(snap.nodes.size).toBe(1);
        expect(snap.nodes.get("n1")?.tags).toEqual(["new"]);
    });

    it("Idempotence Property (Removals): Applying a removal diff multiple times produces the exact same graph snapshot as applying it once", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }, { id: "n2" }],
            edges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            removedEdges: ["e1"]
        });

        const snap1 = applyGraphDiff(base, diff);
        const snap2 = applyGraphDiff(snap1, diff);
        const snap3 = applyGraphDiff(snap2, diff);

        expect(graphSnapshotToJson(snap1)).toEqual(graphSnapshotToJson(snap2));
        expect(graphSnapshotToJson(snap1)).toEqual(graphSnapshotToJson(snap3));

        // State should just be n2
        expect(snap3.nodes.size).toBe(1);
        expect(snap3.nodes.has("n2")).toBe(true);
        expect(snap3.edges.size).toBe(0);
    });

    it("Involution Property of invertGraphDiff: The inverse of an inverse diff is identical to the original diff", () => {
        const base = createGraphSnapshot({
            nodes: [
                { id: "n1", tags: ["old"], attributes: { key: "val1" } },
                { id: "n2" }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n2", tags: ["link"] }
            ]
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            removedEdges: ["e1"],
            addedNodes: [
                { id: "n1", tags: ["new"], attributes: { key: "val2" } },
                { id: "n3" }
            ],
            addedEdges: [
                { id: "e2", source: "n1", target: "n3" }
            ]
        });

        const nextSnap = applyGraphDiff(base, diff);
        const inverseDiff = invertGraphDiff(base, diff);
        const inverseOfInverse = invertGraphDiff(nextSnap, inverseDiff);

        expect(graphDiffToJson(inverseOfInverse)).toEqual(graphDiffToJson(diff));
    });

    it("Invertibility Property: For any valid diff, an exact inverse diff exists that perfectly restores the original graph state", () => {
        const base = createGraphSnapshot({
            nodes: [
                { id: "n1", tags: ["old"], attributes: { key: "val1" } },
                { id: "n2" }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n2", tags: ["link"] }
            ]
        });

        // A complex diff that removes, adds, and replaces
        const diff = createGraphDiff({
            removedNodes: ["n1"], // We replace n1
            removedEdges: ["e1"],
            addedNodes: [
                { id: "n1", tags: ["new"], attributes: { key: "val2" } },
                { id: "n3" }
            ],
            addedEdges: [
                { id: "e2", source: "n1", target: "n3" }
            ]
        });

        const nextSnap = applyGraphDiff(base, diff);

        const inverseDiff = invertGraphDiff(base, diff);

        const restoredSnap = applyGraphDiff(nextSnap, inverseDiff);

        // The doubly-applied diff must strictly equal the base state
        expect(graphSnapshotToJson(restoredSnap)).toEqual(graphSnapshotToJson(base));
        expect(restoredSnap.nodes).toEqual(base.nodes);
        expect(restoredSnap.edges).toEqual(base.edges);
    });


    it("Edge Subgraph Closure Property: Removing any arbitrary combination of edges from a valid graph ALWAYS yields a valid graph", () => {
        // Build a moderately complex valid graph
        const base = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [
                { id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }
            ],
            edges: [
                { id: "e1", source: "A", target: "B", tags: ["contains"] },
                { id: "e2", source: "A", target: "C", tags: ["contains"] },
                { id: "e3", source: "B", target: "D" },
                { id: "e4", source: "C", target: "D" },
                { id: "e5", source: "D", target: "E" },
                { id: "e6", source: "E", target: "A" } // Non-containment cycle
            ]
        });

        // Test removing a subset of edges
        const diff1 = createGraphDiff({
            removedEdges: ["e1", "e4", "e5"]
        });

        // Test removing all edges
        const diff2 = createGraphDiff({
            removedEdges: ["e1", "e2", "e3", "e4", "e5", "e6"]
        });

        // The property asserts that applying these diffs should not throw any Structural/Model errors.
        const snap1 = applyGraphDiff(base, diff1);
        expect(snap1.nodes.size).toBe(5);
        expect(snap1.edges.size).toBe(3);

        const snap2 = applyGraphDiff(base, diff2);
        expect(snap2.nodes.size).toBe(5);
        expect(snap2.edges.size).toBe(0);
    });

    it("Node Induced Subgraph Closure Property: Removing any arbitrary subset of nodes, provided all incident edges are also removed, ALWAYS yields a valid graph", () => {
        const base = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [
                { id: "A" }, { id: "B" }, { id: "C" }
            ],
            edges: [
                { id: "e1", source: "A", target: "B", tags: ["contains"] },
                { id: "e2", source: "B", target: "C", tags: ["contains"] }
            ]
        });

        // Remove node B, and incident edges e1, e2
        const diff = createGraphDiff({
            removedNodes: ["B"],
            removedEdges: ["e1", "e2"]
        });

        const snap = applyGraphDiff(base, diff);
        expect(snap.nodes.size).toBe(2);
        expect(snap.nodes.has("B")).toBe(false);
        expect(snap.edges.size).toBe(0);
    });

});

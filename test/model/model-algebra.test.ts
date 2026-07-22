import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson } from "../../src/model";

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

        // Helper to compute the exact mathematical inverse of a diff.
        // What was removed must be added back (with identical data from the original state).
        // What was added must be removed.
        const inverseDiff = createGraphDiff({
            removedNodes: diff.addedNodes.map(n => n.id),
            removedEdges: diff.addedEdges.map(e => e.id),
            addedNodes: diff.removedNodes.map(id => {
                const node = base.nodes.get(id);
                if (!node) throw new Error(`Node ${id} not found in base`);
                // Note: GraphNode and GraphNodeJson structures are compatible here
                return { id: node.id, tags: [...node.tags], attributes: { ...node.attributes } };
            }),
            addedEdges: diff.removedEdges.map(id => {
                const edge = base.edges.get(id);
                if (!edge) throw new Error(`Edge ${id} not found in base`);
                return { id: edge.id, source: edge.source, target: edge.target, tags: [...edge.tags], attributes: { ...edge.attributes } };
            })
        });

        const restoredSnap = applyGraphDiff(nextSnap, inverseDiff);

        // The doubly-applied diff must strictly equal the base state
        expect(graphSnapshotToJson(restoredSnap)).toEqual(graphSnapshotToJson(base));
        expect(restoredSnap.nodes).toEqual(base.nodes);
        expect(restoredSnap.edges).toEqual(base.edges);
    });
});

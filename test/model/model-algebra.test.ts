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
});

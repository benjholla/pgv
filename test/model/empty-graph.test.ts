import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson } from "../../src/model";

describe("Empty Graph Boundary Conditions", () => {
    it("Empty Model Property: An entirely empty graph can be constructed and structurally validated", () => {
        const snap = createGraphSnapshot({
            nodes: [],
            edges: []
        });

        expect(snap.nodes.size).toBe(0);
        expect(snap.edges.size).toBe(0);
    });

    it("Empty Schema Property: An empty graph with schema can be serialized", () => {
        const snap = createGraphSnapshot({
            schema: { containment: [] },
            nodes: [],
            edges: []
        });

        const json = graphSnapshotToJson(snap);
        expect(json.nodes).toEqual([]);
        expect(json.edges).toEqual([]);
    });

    it("Empty Diff Property: An empty diff on an empty graph is safe", () => {
        const base = createGraphSnapshot({
            nodes: [],
            edges: []
        });

        const diff = createGraphDiff({
            addedNodes: [],
            addedEdges: [],
            removedNodes: [],
            removedEdges: []
        });

        const next = applyGraphDiff(base, diff);

        expect(next.nodes.size).toBe(0);
        expect(next.edges.size).toBe(0);
    });
});

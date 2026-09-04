import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, GraphModelError } from "../../src/model";

describe("applyGraphDiff edge endpoint node validation", () => {
    it("Adding an edge where the source node does not exist in the final graph throws an error", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n2" }],
            edges: []
        });

        const diff = createGraphDiff({
            addedEdges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        expect(() => applyGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => applyGraphDiff(base, diff)).toThrow(/references missing source/i);
    });

    it("Adding an edge where the target node does not exist in the final graph throws an error", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }],
            edges: []
        });

        const diff = createGraphDiff({
            addedEdges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        expect(() => applyGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => applyGraphDiff(base, diff)).toThrow(/references missing target/i);
    });

    it("Adding an edge where the source node is removed in the same diff throws an error", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }, { id: "n2" }],
            edges: []
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            addedEdges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        expect(() => applyGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => applyGraphDiff(base, diff)).toThrow(/references missing source/i);
    });

    it("Adding an edge where both nodes are added in the same diff succeeds", () => {
        const base = createGraphSnapshot({
            nodes: [],
            edges: []
        });

        const diff = createGraphDiff({
            addedNodes: [{ id: "n1" }, { id: "n2" }],
            addedEdges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        const next = applyGraphDiff(base, diff);
        expect(next.edges.size).toBe(1);
    });
});

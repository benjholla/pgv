import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff } from "../../src/model";

describe("applyGraphDiff Replacement", () => {
    it("should allow a node to be conceptually replaced by removing and adding it in the same diff", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1", attributes: { title: "old" } }],
            edges: []
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            addedNodes: [{ id: "n1", attributes: { title: "new" } }],
            addedEdges: [],
            removedEdges: []
        });

        const next = applyGraphDiff(base, diff);
        expect(next.nodes.size).toBe(1);
        expect(next.nodes.get("n1")?.attributes?.title).toBe("new");
    });

    it("should allow an edge to be conceptually replaced by removing and adding it in the same diff", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }, { id: "n2" }],
            edges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        const diff = createGraphDiff({
            removedNodes: [],
            addedNodes: [],
            removedEdges: ["e1"],
            addedEdges: [{ id: "e1", source: "n1", target: "n2", attributes: { color: "red" } }]
        });

        const next = applyGraphDiff(base, diff);
        expect(next.edges.size).toBe(1);
        expect(next.edges.get("e1")?.attributes?.color).toBe("red");
    });
});

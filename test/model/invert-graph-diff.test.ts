import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, invertGraphDiff, GraphModelError } from "../../src/model";

describe("invertGraphDiff", () => {
    it("should compute the exact inverse of a diff", () => {
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

        const inverseDiff = invertGraphDiff(base, diff);

        expect(inverseDiff.addedNodes.length).toBe(1);
        expect(inverseDiff.addedNodes[0].id).toBe("n1");
        expect(inverseDiff.addedNodes[0].tags).toEqual(["old"]);
        expect(inverseDiff.addedNodes[0].attributes).toEqual({ key: "val1" });

        expect(inverseDiff.addedEdges.length).toBe(1);
        expect(inverseDiff.addedEdges[0].id).toBe("e1");

        expect(inverseDiff.removedNodes).toEqual(["n1", "n3"]);
        expect(inverseDiff.removedEdges).toEqual(["e2"]);
    });

    it("should throw GraphModelError if a removed node is not in the base snapshot", () => {
        const base = createGraphSnapshot({
            nodes: [],
            edges: []
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            removedEdges: []
        });

        expect(() => invertGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => invertGraphDiff(base, diff)).toThrow(/not found in base snapshot/);
    });

    it("should throw GraphModelError if a removed edge is not in the base snapshot", () => {
        const base = createGraphSnapshot({
            nodes: [],
            edges: []
        });

        const diff = createGraphDiff({
            removedNodes: [],
            removedEdges: ["e1"]
        });

        expect(() => invertGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => invertGraphDiff(base, diff)).toThrow(/not found in base snapshot/);
    });
});

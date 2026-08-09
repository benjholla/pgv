import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, invertGraphDiff, GraphModelError } from "../../src/model";

describe("applyGraphDiff Missing Removals properties", () => {
    it("Removing an element that does not exist fails silently in applyGraphDiff but throws in invertGraphDiff", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }, { id: "n2" }],
            edges: []
        });

        // 1. Removing a missing node
        const diff1 = createGraphDiff({ removedNodes: ["n3"] });

        // Inverting it fails strictly
        expect(() => invertGraphDiff(base, diff1)).toThrow(GraphModelError);
        expect(() => invertGraphDiff(base, diff1)).toThrow(/Cannot invert diff: Node "n3" not found in base snapshot/);

        // Applying it succeeds silently
        const next1 = applyGraphDiff(base, diff1);
        expect(next1.nodes.size).toBe(2);

        // 2. Removing a missing edge
        const diff2 = createGraphDiff({ removedEdges: ["e1"] });

        // Inverting it fails strictly
        expect(() => invertGraphDiff(base, diff2)).toThrow(GraphModelError);
        expect(() => invertGraphDiff(base, diff2)).toThrow(/Cannot invert diff: Edge "e1" not found in base snapshot/);

        // Applying it succeeds silently
        const next2 = applyGraphDiff(base, diff2);
        expect(next2.edges.size).toBe(0);
    });
});

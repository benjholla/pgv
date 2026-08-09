import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, GraphModelError } from "../../src/model";

describe("Removing nodes without incident edges throws", () => {
    it("Removing a node without its incident edges throws", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }, { id: "n2" }],
            edges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        // Removing n1 without removing e1 should cause e1 to dangle, throwing a validation error
        const diff = createGraphDiff({
            removedNodes: ["n1"]
        });

        expect(() => applyGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => applyGraphDiff(base, diff)).toThrow(/references missing source/i);
    });
});

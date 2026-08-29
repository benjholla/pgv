import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, invertGraphDiff, applyGraphDiff } from "../../src/model";

describe("invertGraphDiff Properties", () => {
    it("Involutory Property: Inverting an inverted diff against the applied state restores the original diff", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1", attributes: { val: "A" } }],
            edges: []
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            addedNodes: [{ id: "n1", attributes: { val: "B" } }],
            addedEdges: [],
            removedEdges: []
        });

        // Inverse diff that takes us from (Base + Diff) back to Base
        const inverseDiff = invertGraphDiff(base, diff);

        // Apply diff to get intermediate state
        const intermediate = applyGraphDiff(base, diff);

        // If we invert the inverseDiff against the intermediate state,
        // we should get back the original diff.
        const doubleInverseDiff = invertGraphDiff(intermediate, inverseDiff);

        expect(doubleInverseDiff.addedNodes).toEqual(diff.addedNodes);
        expect(doubleInverseDiff.removedNodes).toEqual(diff.removedNodes);
        expect(doubleInverseDiff.addedEdges).toEqual(diff.addedEdges);
        expect(doubleInverseDiff.removedEdges).toEqual(diff.removedEdges);
    });
});

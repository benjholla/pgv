import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson } from "../../src/model";

describe("applyGraphDiff Idempotence", () => {
    it("Applying a diff that adds elements that are already removed is safe but throws if adds exist", () => {
        const base = createGraphSnapshot({
            nodes: [{ id: "n1" }],
            edges: []
        });

        // This diff removes nothing (n2 isn't there), and adds n1
        const diff = createGraphDiff({
            addedNodes: [{ id: "n1" }],
            addedEdges: []
        });

        // We expect it to throw on duplicate
        expect(() => applyGraphDiff(base, diff)).toThrow(/duplicate node id/);
    });
});

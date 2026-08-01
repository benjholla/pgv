import { describe, it, expect } from "vitest";
import { createGraphDiff } from "../../src/model";

describe("Duplicate elements in Diff removed arrays", () => {
    it("Duplicate nodes in diff removedNodes", () => {
        expect(() => createGraphDiff({
            removedNodes: ["n1", "n1"]
        })).toThrow(/duplicate node id/i);
    });

    it("Duplicate edges in diff removedEdges", () => {
        expect(() => createGraphDiff({
            removedEdges: ["e1", "e1"]
        })).toThrow(/duplicate edge id/i);
    });
});

import { describe, it, expect } from "vitest";
import { createGraphDiff } from "../../src/model";

describe("Duplicate elements in Diff", () => {
    it("Duplicate nodes in diff addedNodes", () => {
        expect(() => createGraphDiff({
            addedNodes: [{ id: "n1" }, { id: "n1" }]
        })).toThrow(/duplicate node id/i);
    });

    it("Duplicate edges in diff addedEdges", () => {
        expect(() => createGraphDiff({
            addedEdges: [{ id: "e1", source: "a", target: "b" }, { id: "e1", source: "c", target: "d" }]
        })).toThrow(/duplicate edge id/i);
    });
});

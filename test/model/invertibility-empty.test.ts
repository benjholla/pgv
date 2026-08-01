import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson } from "../../src/model";

describe("Diff Properties", () => {
    it("Empty additions and removals array properties: Arrays default to empty if undefined", () => {
        const diff = createGraphDiff({} as any);
        expect(diff.addedNodes).toEqual([]);
        expect(diff.addedEdges).toEqual([]);
        expect(diff.removedNodes).toEqual([]);
        expect(diff.removedEdges).toEqual([]);
    });
});

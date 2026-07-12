import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson } from "../src/model";

describe("Serialization Determinism", () => {
  it("produces identical JSON output for identical graphs regardless of construction order", () => {
    const base = createGraphSnapshot({ nodes: [], edges: [] });
    const diff1 = createGraphDiff({ addedNodes: [{id: "A", tags: [], attributes: {}}], addedEdges: [] });
    const diff2 = createGraphDiff({ addedNodes: [{id: "B", tags: [], attributes: {}}], addedEdges: [] });

    const snap1 = applyGraphDiff(applyGraphDiff(base, diff1), diff2);
    const snap2 = applyGraphDiff(applyGraphDiff(base, diff2), diff1);

    expect(graphSnapshotToJson(snap1)).toEqual(graphSnapshotToJson(snap2));
  });
});

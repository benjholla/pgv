import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, graphSnapshotToJson, graphDiffToJson } from "../../src/model";

describe("Serialization Determinism", () => {
  it("produces identical JSON output for identical graphs regardless of construction order", () => {
    const base = createGraphSnapshot({ nodes: [], edges: [] });
    const diff1 = createGraphDiff({ addedNodes: [{id: "A", tags: [], attributes: {}}], addedEdges: [] });
    const diff2 = createGraphDiff({ addedNodes: [{id: "B", tags: [], attributes: {}}], addedEdges: [] });

    const snap1 = applyGraphDiff(applyGraphDiff(base, diff1), diff2);
    const snap2 = applyGraphDiff(applyGraphDiff(base, diff2), diff1);

    expect(graphSnapshotToJson(snap1)).toEqual(graphSnapshotToJson(snap2));
  });

  it("produces identical JSON output for equivalent diffs regardless of the array order in construction", () => {
    const diff1 = createGraphDiff({
      addedNodes: [{ id: "A", tags: [], attributes: {} }, { id: "B", tags: [], attributes: {} }],
      addedEdges: [{ id: "e1", source: "A", target: "B", tags: [], attributes: {} }, { id: "e2", source: "B", target: "A", tags: [], attributes: {} }],
      removedNodes: ["C", "D"],
      removedEdges: ["e3", "e4"]
    });

    const diff2 = createGraphDiff({
      addedNodes: [{ id: "B", tags: [], attributes: {} }, { id: "A", tags: [], attributes: {} }],
      addedEdges: [{ id: "e2", source: "B", target: "A", tags: [], attributes: {} }, { id: "e1", source: "A", target: "B", tags: [], attributes: {} }],
      removedNodes: ["D", "C"],
      removedEdges: ["e4", "e3"]
    });

    expect(graphDiffToJson(diff1)).toEqual(graphDiffToJson(diff2));
  });
});

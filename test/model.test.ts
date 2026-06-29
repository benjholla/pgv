import { describe, it, expect } from "vitest";
import {
  createGraphSnapshot,
  graphSnapshotToJson,
  graphSnapshotFromJson,
  createGraphDiff,
  applyGraphDiff,
  graphDiffToJson,
  graphDiffFromJson,
  GraphModelError,
  GraphSnapshotJson,
  GraphDiffJson
} from "../src/model";

describe("model", () => {
  describe("createGraphSnapshot", () => {
    it("creates an empty snapshot successfully", () => {
      const json: GraphSnapshotJson = {
        graphId: "test-1",
        version: 1,
        nodes: [],
        edges: []
      };
      const snapshot = createGraphSnapshot(json);
      expect(snapshot.graphId).toBe("test-1");
      expect(snapshot.version).toBe(1);
      expect(snapshot.nodes.size).toBe(0);
      expect(snapshot.edges.size).toBe(0);
    });

    it("creates a snapshot with valid nodes and edges", () => {
      const json: GraphSnapshotJson = {
        graphId: "test-2",
        version: "v1",
        nodes: [
          { id: "n1", tags: ["A"], attributes: { val: 1 } },
          { id: "n2", parent: "n1", attributes: { active: true } }
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2", tags: ["link"] }
        ]
      };
      const snapshot = createGraphSnapshot(json);
      expect(snapshot.nodes.size).toBe(2);
      expect(snapshot.edges.size).toBe(1);

      const n1 = snapshot.nodes.get("n1");
      expect(n1?.tags).toEqual(["A"]);
      expect(n1?.attributes).toEqual({ val: 1 });

      const e1 = snapshot.edges.get("e1");
      expect(e1?.source).toBe("n1");
      expect(e1?.target).toBe("n2");
    });

    it("throws on duplicate node ID", () => {
      const json: GraphSnapshotJson = {
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1" }, { id: "n1" }],
        edges: []
      };
      expect(() => createGraphSnapshot(json)).toThrow(GraphModelError);
      expect(() => createGraphSnapshot(json)).toThrow(/Duplicate node id/);
    });

    it("throws on missing parent node reference", () => {
      const json: GraphSnapshotJson = {
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1", parent: "missing" }],
        edges: []
      };
      expect(() => createGraphSnapshot(json)).toThrow(GraphModelError);
      expect(() => createGraphSnapshot(json)).toThrow(/references missing parent/);
    });

    it("throws on missing source or target node reference", () => {
      expect(() => createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1" }],
        edges: [{ id: "e1", source: "n1", target: "missing" }]
      })).toThrow(/references missing target/);

      expect(() => createGraphSnapshot({
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1" }],
        edges: [{ id: "e1", source: "missing", target: "n1" }]
      })).toThrow(/references missing source/);
    });

    it("throws on duplicate edge ID", () => {
      const json: GraphSnapshotJson = {
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1" }, { id: "n2" }],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e1", source: "n2", target: "n1" }
        ]
      };
      expect(() => createGraphSnapshot(json)).toThrow(/Duplicate edge id/);
    });

    it("throws on empty strings for IDs or tags", () => {
      expect(() => createGraphSnapshot({
        graphId: "", version: 1, nodes: [], edges: []
      })).toThrow(/non-empty string/);

      expect(() => createGraphSnapshot({
        graphId: "test", version: 1, nodes: [{ id: " " }], edges: []
      })).toThrow(/non-empty string/);

      expect(() => createGraphSnapshot({
        graphId: "test", version: 1, nodes: [{ id: "n1", tags: [""] }], edges: []
      })).toThrow(/non-empty string/);
    });

    it("throws on unsafe content in graphId", () => {
      expect(() => createGraphSnapshot({
        graphId: "javascript:alert(1)", version: 1, nodes: [], edges: []
      })).toThrow(/contains unsafe content/);
    });

    it("throws on unsupported attribute value types", () => {
      const invalidJson: any = {
        graphId: "test",
        version: 1,
        nodes: [{ id: "n1", attributes: { obj: {} } }],
        edges: []
      };
      expect(() => createGraphSnapshot(invalidJson)).toThrow(/unsupported value type/);
    });

    it("sanitizes unsafe strings in attributes", () => {
      const json: GraphSnapshotJson = {
        graphId: "test",
        version: 1,
        nodes: [{
          id: "n1", attributes: {
            safe: "hello world",
            jsUri: "javascript:alert(1)",
            vbUri: "vbscript:msgbox(1)",
            dataUri: "data:text/html,<script>alert(1)</script>",
            scriptTag: "<script>alert(1)</script>",
            inlineEvent: "onclick=alert(1)",
            cssExpr: "expression(alert(1))"
          }
        }],
        edges: []
      };

      const snapshot = createGraphSnapshot(json);
      const attrs = snapshot.nodes.get("n1")!.attributes;

      expect(attrs.safe).toBe("hello world");
      expect(attrs.jsUri).toBe("#blocked-uri");
      expect(attrs.vbUri).toBe("#blocked-uri");
      expect(attrs.dataUri).toBe("#blocked-uri");
      expect(attrs.scriptTag).toBe("alert(1)");
      expect(attrs.inlineEvent).toBe("data-blocked=alert(1)");
      expect(attrs.cssExpr).toBe("blocked-expr(alert(1))");
    });
  });

  describe("algebraic properties of applyGraphDiff", () => {
    const baseSnapshot = createGraphSnapshot({
      graphId: "test-algebraic",
      version: 1,
      nodes: [
        { id: "n1", tags: ["A"], attributes: { val: 1 } },
        { id: "n2", parent: "n1", tags: [], attributes: {} }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", tags: ["E"], attributes: {} }
      ]
    });

    it("Identity: Applying an empty diff yields an equivalent snapshot", () => {
      const emptyDiff = createGraphDiff({});
      const nextSnapshot = applyGraphDiff(baseSnapshot, emptyDiff, 2);

      // Same structural contents (JSON serialized representation should be identical except for version)
      const baseJson = graphSnapshotToJson(baseSnapshot);
      const nextJson = graphSnapshotToJson(nextSnapshot);

      expect({ ...nextJson, version: 1 }).toEqual(baseJson);
      expect(nextSnapshot.nodes.size).toBe(baseSnapshot.nodes.size);
      expect(nextSnapshot.edges.size).toBe(baseSnapshot.edges.size);
    });

    it("Round-trip/Inverse: Adding elements then removing them yields the original graph", () => {
      // Step 1: Add new elements
      const addDiff = createGraphDiff({
        addedNodes: [{ id: "n3", tags: ["C"], attributes: {} }],
        addedEdges: [{ id: "e2", source: "n1", target: "n3", tags: [], attributes: {} }]
      });
      const snapshotAfterAdd = applyGraphDiff(baseSnapshot, addDiff, 2);

      // Step 2: Remove those exact elements
      const removeDiff = createGraphDiff({
        removedNodes: ["n3"],
        removedEdges: ["e2"]
      });
      const snapshotAfterRemove = applyGraphDiff(snapshotAfterAdd, removeDiff, 3);

      // The final snapshot should be structurally identical to the base snapshot
      const baseJson = graphSnapshotToJson(baseSnapshot);
      const finalJson = graphSnapshotToJson(snapshotAfterRemove);

      expect({ ...finalJson, version: 1 }).toEqual(baseJson);
    });
  });

  describe("serialization and deserialization properties", () => {
    it("round-trips GraphSnapshotJson to GraphSnapshot and back", () => {
      const originalJson: GraphSnapshotJson = {
        graphId: "test-roundtrip",
        version: 42,
        nodes: [
          { id: "n1", tags: ["A"], attributes: { a: 1, b: "string", c: true, d: null } },
          { id: "n2", parent: "n1", tags: [], attributes: {} }
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2", tags: ["E"], attributes: {} }
        ]
      };

      const snapshot = graphSnapshotFromJson(originalJson);
      const jsonOut = graphSnapshotToJson(snapshot);

      expect(jsonOut).toEqual(originalJson);
    });

    it("round-trips GraphDiffJson to GraphDiff and back", () => {
      const diffJson: GraphDiffJson = {
        addedNodes: [{ id: "n3", tags: ["C"], attributes: {} }],
        addedEdges: [{ id: "e2", source: "n1", target: "n3", tags: [], attributes: {} }],
        removedNodes: ["n2"],
        removedEdges: ["e1"]
      };

      const diff = graphDiffFromJson(diffJson);
      const diffOut = graphDiffToJson(diff);

      expect(diffOut).toEqual(diffJson);
    });
  });

  describe("applyGraphDiff", () => {
    const baseSnapshot = createGraphSnapshot({
      graphId: "test-diff",
      version: 1,
      nodes: [
        { id: "n1" },
        { id: "n2", parent: "n1" }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2" }
      ]
    });

    it("applies valid additions and removals", () => {
      const diff = createGraphDiff({
        removedEdges: ["e1"],
        removedNodes: ["n2"],
        addedNodes: [{ id: "n3" }],
        addedEdges: [{ id: "e2", source: "n1", target: "n3" }]
      });

      const nextSnapshot = applyGraphDiff(baseSnapshot, diff, 2);

      expect(nextSnapshot.graphId).toBe("test-diff");
      expect(nextSnapshot.version).toBe(2);
      expect(nextSnapshot.nodes.has("n2")).toBe(false);
      expect(nextSnapshot.edges.has("e1")).toBe(false);
      expect(nextSnapshot.nodes.has("n3")).toBe(true);
      expect(nextSnapshot.edges.has("e2")).toBe(true);

      // Original unchanged nodes are still there
      expect(nextSnapshot.nodes.has("n1")).toBe(true);
    });

    it("throws on adding duplicate node ID", () => {
      const diff = createGraphDiff({ addedNodes: [{ id: "n1" }] });
      expect(() => applyGraphDiff(baseSnapshot, diff, 2)).toThrow(/duplicate node id/);
    });

    it("throws on adding duplicate edge ID", () => {
      const diff = createGraphDiff({ addedEdges: [{ id: "e1", source: "n1", target: "n2" }] });
      expect(() => applyGraphDiff(baseSnapshot, diff, 2)).toThrow(/duplicate edge id/);
    });

    it("throws when adding a node with missing parent", () => {
      const diff = createGraphDiff({ addedNodes: [{ id: "n3", parent: "missing" }] });
      expect(() => applyGraphDiff(baseSnapshot, diff, 2)).toThrow(/references missing parent/);
    });

    it("throws when adding an edge with missing source or target", () => {
      expect(() => applyGraphDiff(baseSnapshot, createGraphDiff({
        addedEdges: [{ id: "e2", source: "missing", target: "n1" }]
      }), 2)).toThrow(/references missing source/);

      expect(() => applyGraphDiff(baseSnapshot, createGraphDiff({
        addedEdges: [{ id: "e2", source: "n1", target: "missing" }]
      }), 2)).toThrow(/references missing target/);
    });

    it("throws when removing a node leaves an orphaned edge", () => {
      const diff = createGraphDiff({ removedNodes: ["n2"] }); // n1->n2 edge still exists
      expect(() => applyGraphDiff(baseSnapshot, diff, 2)).toThrow(/references missing target/);
    });

    it("throws when removing a node leaves an orphaned child node", () => {
      const diff = createGraphDiff({ removedNodes: ["n1"], removedEdges: ["e1"] }); // n2 has parent n1
      expect(() => applyGraphDiff(baseSnapshot, diff, 2)).toThrow(/references missing parent/);
    });

    it("allows adding a node and edge simultaneously", () => {
      // Adding n3 and e2(n1 -> n3) should work in the same diff
      const diff = createGraphDiff({
        addedNodes: [{ id: "n3" }],
        addedEdges: [{ id: "e2", source: "n1", target: "n3" }]
      });
      const nextSnapshot = applyGraphDiff(baseSnapshot, diff, 2);
      expect(nextSnapshot.edges.get("e2")?.target).toBe("n3");
    });
  });
});

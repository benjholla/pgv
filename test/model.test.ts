import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, graphSnapshotToJson, applyGraphDiff, graphDiffToJson, GraphModelError, GraphSnapshotJson, GraphDiffJson } from "../src/model";

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
            nestedScriptTag: "<scr<script>ipt>alert(1)</script>",
            inlineEvent: "onclick=alert(1)",
            cssExpr: "expression(alert(1))",
            entityBypass: "&#x6A;avascript:alert(1)",
            urlEncodedBypass: "j%61vascript:alert(1)",
            entityUrlEncodedBypass: "j&#x25;61vascript:alert(1)",
            malformedUrlEncodedBypass: "j%61vascript:alert(1)//%FF",
            whitespaceBypass: "j\ta\nv\ra\ts\nc\rr\ti\np\rt\t:alert(1)",
            mixedCaseDataUri: "DaTa:TexT/HTmL;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
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
      expect(attrs.nestedScriptTag).toBe("alert(1)");
      expect(attrs.inlineEvent).toBe("data-blocked=alert(1)");
      expect(attrs.cssExpr).toBe("blocked-expr(alert(1))");
      expect(attrs.entityBypass).toBe("#blocked-uri");
      expect(attrs.urlEncodedBypass).toBe("#blocked-uri");
      expect(attrs.entityUrlEncodedBypass).toBe("#blocked-uri");
      expect(attrs.malformedUrlEncodedBypass).toBe("#blocked-uri");
      expect(attrs.whitespaceBypass).toBe("#blocked-uri");
      expect(attrs.mixedCaseDataUri).toBe("#blocked-uri");
    });
  });

  describe("algebraic properties of applyGraphDiff", () => {
    describe("Property and Edge Case Tests", () => {
      it("Commutativity: Independent diffs can be applied in any order with identical results", () => {
        const base = createGraphSnapshot({
          graphId: "test",
          version: 1,
          nodes: [{ id: "n1" }],
          edges: []
        });

        const diff1 = createGraphDiff({
          addedNodes: [{ id: "n2" }],
          addedEdges: [{ id: "e1", source: "n1", target: "n2" }]
        });

        const diff2 = createGraphDiff({
          addedNodes: [{ id: "n3" }],
          addedEdges: [{ id: "e2", source: "n1", target: "n3" }]
        });

        const snap1 = applyGraphDiff(applyGraphDiff(base, diff1, 2), diff2, 3);
        const snap2 = applyGraphDiff(applyGraphDiff(base, diff2, 2), diff1, 3);

        const ids1 = Array.from(snap1.nodes.keys()).sort();
        const ids2 = Array.from(snap2.nodes.keys()).sort();
        expect(ids1).toEqual(ids2);

        const eids1 = Array.from(snap1.edges.keys()).sort();
        const eids2 = Array.from(snap2.edges.keys()).sort();
        expect(eids1).toEqual(eids2);
      });

      it("Replacement Property: Safely replace an element in a single diff without duplicate ID errors", () => {
        const base = createGraphSnapshot({
          graphId: "test",
          version: 1,
          nodes: [{ id: "n1", tags: ["old"] }],
          edges: []
        });

        const diff = createGraphDiff({
          removedNodes: ["n1"],
          addedNodes: [{ id: "n1", tags: ["new"] }]
        });

        const snap = applyGraphDiff(base, diff, 2);

        expect(snap.nodes.size).toBe(1);
        expect(snap.nodes.get("n1")?.tags).toEqual(["new"]);
      });

      it("Security Properties: Benign URIs are preserved while dangerous ones are blocked", () => {
        const json: GraphSnapshotJson = {
          graphId: "test",
          version: 1,
          nodes: [{
            id: "n1", attributes: {
              safeData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
              dangerousData: "data:text/html,<script>alert(1)</script>",
              safeHttp: "https://example.com/image.png",
              dangerousJs: "javascript:alert(1)"
            }
          }],
          edges: []
        };

        const snapshot = createGraphSnapshot(json);
        const attrs = snapshot.nodes.get("n1")!.attributes;

        expect(attrs.safeData).toContain("data:image/png");
        expect(attrs.dangerousData).toBe("#blocked-uri");
        expect(attrs.safeHttp).toBe("https://example.com/image.png");
        expect(attrs.dangerousJs).toBe("#blocked-uri");
      });
    });

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

    it("Idempotence: Removing non-existent elements is a safe no-op", () => {
      const diff = createGraphDiff({
        removedNodes: ["missing-node-123"],
        removedEdges: ["missing-edge-123"]
      });

      const nextSnapshot = applyGraphDiff(baseSnapshot, diff, 2);

      // Same structural contents (version should update, but elements remain the same)
      const baseJson = graphSnapshotToJson(baseSnapshot);
      const nextJson = graphSnapshotToJson(nextSnapshot);

      expect({ ...nextJson, version: 1 }).toEqual(baseJson);
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

      const snapshot = createGraphSnapshot(originalJson);
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

      const diff = createGraphDiff(diffJson);
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

    it("throws when diff contains duplicate nodes directly", () => {
      // Cannot use createGraphDiff directly because it throws, so we simulate the raw object
      const diff: GraphDiffJson = {
        addedNodes: [{ id: "n3" }, { id: "n3" }],
        removedNodes: [],
        removedEdges: []
      };
      // We must cast because applyGraphDiff expects the frozen GraphDiff interface
      expect(() => applyGraphDiff(baseSnapshot, diff as any, 2)).toThrow(/duplicate node id/);
    });

    it("throws when diff contains duplicate edges directly", () => {
      const diff: GraphDiffJson = {
        addedEdges: [
          { id: "e2", source: "n1", target: "n2" },
          { id: "e2", source: "n1", target: "n2" }
        ],
        addedNodes: [],
        removedNodes: [],
        removedEdges: []
      };
      expect(() => applyGraphDiff(baseSnapshot, diff as any, 2)).toThrow(/duplicate edge id/);
    });

    it("throws when removing a node leaves an orphaned edge source", () => {
      // Use a custom snapshot without parent dependencies to isolate the source edge error
      const customBase = createGraphSnapshot({
        graphId: "test-diff-source",
        version: 1,
        nodes: [{ id: "n1" }, { id: "n3" }],
        edges: [{ id: "e2", source: "n1", target: "n3" }]
      });
      // e2 source n1 is removed, but e2 itself is not explicitly removed.
      const diff = createGraphDiff({ removedNodes: ["n1"] });
      expect(() => applyGraphDiff(customBase, diff, 2)).toThrow(/references missing source/);
    });

    it("throws when removing a node leaves an orphaned edge target", () => {
      // Use a custom snapshot without parent dependencies to isolate the target edge error
      const customBase = createGraphSnapshot({
        graphId: "test-diff-target",
        version: 1,
        nodes: [{ id: "n1" }, { id: "n3" }],
        edges: [{ id: "e2", source: "n1", target: "n3" }]
      });
      // n1->n3 edge exists. We remove n3, but not e2. e2's target is now missing.
      const diff = createGraphDiff({ removedNodes: ["n3"] });
      expect(() => applyGraphDiff(customBase, diff, 2)).toThrow(/references missing target/);
    });
  });
});

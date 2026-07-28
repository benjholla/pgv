import { describe, it, expect } from "vitest";
import { createGraphSnapshot } from "../../src/model";

describe("Coverage fixes for src/model.ts", () => {
    it("DFS Property: gracefully handles early return on already visited nodes during cycle detection", () => {
        const snap = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "A" }, { id: "B" }],
            edges: [
                { id: "e1", source: "A", target: "B", tags: ["contains"] }
            ]
        });
        expect(snap).toBeDefined();
    });

    it("handles correct float attribute properties to reach line 739", () => {
      const validJson = {
        nodes: [{
          id: "n1", tags: [], attributes: {
            f: { float: 42.5 }
          }
        }],
        edges: []
      };
      const snapshot = createGraphSnapshot(validJson as any);
      expect(snapshot.nodes.get("n1")!.attributes.f).toEqual({ float: 42.5 });
    });
});

import { describe, it, expect } from "vitest";
import { createGraphSnapshot, sanitizeString } from "../../src/model";

describe("sanitizeString fallback and parsing", () => {
    it("handles correct float attribute properties natively", () => {
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

    it("covers the relMatch false branch for sanitizeString when target=_blank without rel", () => {
      const snapshot = createGraphSnapshot({
        nodes: [{ id: "n1", tags: [], attributes: { t: '<a target="_blank" rel>Link</a>' } }],
        edges: []
      });
      // the empty 'rel' results in it replacing the empty attribute or triggering the fallback.
      expect(snapshot.nodes.get("n1")!.attributes.t).toBe('<a target="_blank" rel="noopener noreferrer">Link</a>');
    });
});

import { describe, it, expect } from "vitest";
import { createGraphSnapshot } from "../../src/model";

describe("freezeAttributes Prototype Pollution", () => {
  it("prevents __proto__ pollution in attribute maps", () => {
    // When parsing and freezing attributes, the initialized sanitized attribute
    // map should be created with Object.create(null) instead of {}
    const json = JSON.parse(`{
      "graphId": "test-proto",
      "version": 1,
      "nodes": [
        {
          "id": "A",
          "attributes": {
            "__proto__": { "polluted": true },
            "normal": "value"
          }
        }
      ],
      "edges": []
    }`);

    // We expect GraphModelError to be thrown because "__proto__" will be seen as an invalid value type
    // If it is initialized with {}, it evaluates correctly as an attribute but mutates prototype
    expect(() => createGraphSnapshot(json)).toThrow();

    const validJson = JSON.parse(`{
      "graphId": "test-proto-2",
      "version": 1,
      "nodes": [
        {
          "id": "A",
          "attributes": {
            "__proto__": "polluted",
            "normal": "value"
          }
        }
      ],
      "edges": []
    }`);

    const snapshot = createGraphSnapshot(validJson);
    const node = snapshot.nodes.get("A");
    expect(Object.getPrototypeOf(node?.attributes)).toBeNull();
  });
});

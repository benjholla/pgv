import { describe, it, expect } from "vitest";
import { createGraphSnapshot, graphSnapshotToJson, AttributeValue } from "../../src/model";

describe("Attribute Value Properties", () => {
  it("Conservation Property: All supported AttributeValue types are strictly conserved through a serialization round-trip", () => {
    // Generate an exhaustive set of boundary and canonical edge cases for all supported disjoint union types
    const attributes: Record<string, AttributeValue> = {
      // String identity and edge cases
      str_normal: "hello world",
      str_empty: "",
      str_whitespace: "   \n\t ",
      str_unicode: "🚀🌟",

      // Boolean identity
      bool_true: true,
      bool_false: false,

      // Integer wrapper identity and boundaries (avoiding JS float ambiguity)
      int_zero: { integer: 0 },
      int_positive: { integer: 42 },
      int_negative: { integer: -42 },
      int_max: { integer: Number.MAX_SAFE_INTEGER },
      int_min: { integer: Number.MIN_SAFE_INTEGER },

      // Float wrapper identity and boundaries
      float_zero: { float: 0.0 },
      float_negative_zero: { float: -0.0 },
      float_positive: { float: 3.14159 },
      float_negative: { float: -2.71828 },
      float_small: { float: Number.EPSILON },

      // Byte array (Base64) identity and edge cases
      bytes_empty: { bytes: "" },
      bytes_normal: { bytes: "SGVsbG8gV29ybGQ=" }, // "Hello World"
      bytes_padded: { bytes: "YQ==" }, // "a"
    };

    const originalSnap = createGraphSnapshot({
      nodes: [
        {
          id: "n1",
          tags: ["test"],
          attributes: attributes
        }
      ],
      edges: []
    });

    const json = graphSnapshotToJson(originalSnap);
    const roundTrippedSnap = createGraphSnapshot(json);

    const roundTrippedAttributes = roundTrippedSnap.nodes.get("n1")!.attributes;

    // The attributes map should be deeply strictly equal, demonstrating absolute conservation of the value types
    expect(roundTrippedAttributes).toEqual(attributes);

    // Additionally, verify explicit type preservation for object wrappers
    expect((roundTrippedAttributes.int_negative as any).integer).toBe(-42);
    expect((roundTrippedAttributes.float_negative as any).float).toBe(-2.71828);
    expect((roundTrippedAttributes.bytes_padded as any).bytes).toBe("YQ==");
  });
});

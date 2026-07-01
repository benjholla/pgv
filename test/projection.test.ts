import { describe, it, expect } from "vitest";
import { identityProjection } from "../src/projection";
import { createGraphSnapshot } from "../src/model";

describe("identityProjection", () => {
  it("Identity: returns the exact same graph snapshot instance", () => {
    const graph = createGraphSnapshot({
      graphId: "test",
      version: 1,
      nodes: [{ id: "n1" }],
      edges: []
    });

    const projected = identityProjection(graph);
    expect(projected).toBe(graph); // strict equality
  });
});

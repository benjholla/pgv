import { describe, it, expect } from "vitest";
import { verticalLayout } from "../../src/layout";
import { createGraphSnapshot } from "../../src/model";

describe("Coverage fixes for src/layout.ts", () => {
  it("handles detached empty parent and detached compound node with children for full layout coverage", () => {
    const snap = createGraphSnapshot({
        schema: { containment: ["contains"] },
        nodes: [{ id: "parent" }, { id: "child" }, { id: "emptyParent" }],
        edges: [
          { id: "e1", source: "parent", target: "child", tags: ["contains"] }
        ]
    });
    const layout = verticalLayout(snap, { collapsedNodes: new Set(["parent"]) });
    expect(layout.nodeSizes.get("emptyParent")?.width).toBeGreaterThan(0);
    expect(layout.nodeSizes.get("parent")?.width).toBeGreaterThan(0);
  });
});

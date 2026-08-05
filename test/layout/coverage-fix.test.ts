import { describe, it, expect } from "vitest";
import { verticalLayout, routeEdgeOrthogonal } from "../../src/layout";
import { createGraphSnapshot, GraphModelError } from "../../src/model";

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

  it("covers fallback edge routing when A* fails to find path", () => {
    const sourcePt = { x: 0, y: 0 };
    const targetPt = { x: 100, y: 100 };
    const obstacleLayout = {
      positions: new Map([
        ["w1", { x: 80, y: 80 }],
        ["w2", { x: 80, y: 100 }],
        ["w3", { x: 100, y: 80 }],
        ["w4", { x: 100, y: 100 }]
      ]),
      nodeSizes: new Map([
        ["w1", { width: 40, height: 20 }],
        ["w2", { width: 20, height: 40 }],
        ["w3", { width: 40, height: 20 }],
        ["w4", { width: 20, height: 40 }]
      ]),
      hierarchy: new Map()
    } as any;

    const path = routeEdgeOrthogonal(sourcePt, targetPt, obstacleLayout, 0, 0, 1, 1, "S", "T");
    expect(path.length).toBe(4);
  });
});

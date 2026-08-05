import { describe, it, expect } from "vitest";
import { routeEdgeOrthogonal } from "../../src/layout";

describe("routeEdgeOrthogonal fallback routing", () => {
  it("covers fallback edge routing when A* fails to find path due to full blockage", () => {
    const sourcePt = { x: 0, y: 0 };
    const targetPt = { x: 100, y: 100 };
    // Create an obstacle that fully surrounds the target point
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

    // Using orthogonal routing should fail A* due to blocked grid, triggering fallback.
    const path = routeEdgeOrthogonal(sourcePt, targetPt, obstacleLayout, 0, 0, 1, 1, "S", "T");
    expect(path.length).toBe(4);
    expect(path[0]).toEqual(sourcePt);
    expect(path[3]).toEqual(targetPt);
  });
});

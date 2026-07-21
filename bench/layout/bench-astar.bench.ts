import { bench, describe } from "vitest";
import { routeEdgeOrthogonal } from "../../src/layout.js";
import { LayoutSnapshot } from "../../src/model.js";

const layout: LayoutSnapshot = {
  width: 1000,
  height: 1000,
  nodeSize: { width: 100, height: 100 },
  nodeSizes: new Map(),
  positions: new Map(
    Array.from({ length: 50 }).map((_, i) => [
      `node${i}`,
      { x: (i % 10) * 120, y: Math.floor(i / 10) * 120 },
    ])
  ),
  edges: [],
};

const sourcePt = { x: 50, y: 50 };
const targetPt = { x: 950, y: 950 };

describe("routeEdgeOrthogonal", () => {
  bench("current", () => {
    routeEdgeOrthogonal(layout, sourcePt, targetPt);
  });
});

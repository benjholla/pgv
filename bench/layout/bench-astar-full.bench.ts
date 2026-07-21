import { bench, describe } from "vitest";
import { routeEdgeOrthogonal as routeEdgeOrthogonalOrig } from "../../src/layout.js";

const layout = {
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
  hierarchy: new Map(),
};

const sourcePt = { x: 50, y: 50 };
const targetPt = { x: 950, y: 950 };

describe("routeEdgeOrthogonal full", () => {
  bench("orig", () => {
    routeEdgeOrthogonalOrig(sourcePt, targetPt, layout as any);
  });
});

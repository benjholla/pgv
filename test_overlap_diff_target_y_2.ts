// Testing if A* found the path, or if it hit the fallback.
// In layout.ts, if A* succeeds, it returns `Object.freeze(path.reverse());`.
// If it fails, it returns `Object.freeze([ sourcePt, { x: sourcePt.x, y: allowedY1 }, { x: targetPt.x, y: allowedY2 }, targetPt ]);`.

// The path returned is EXACTLY the fallback format.
// Wait! Let's check if it's the fallback!
import { routeEdgeOrthogonal } from "./src/layout";

const layout = {
  positions: new Map([
    ["child1", { x: 50, y: 50 }],
    ["child2", { x: 150, y: 50 }],
    ["child3", { x: 250, y: 50 }]
  ]),
  nodeSizes: new Map([
    ["child1", { width: 50, height: 50 }],
    ["child2", { width: 50, height: 50 }],
    ["child3", { width: 50, height: 50 }]
  ]),
  hierarchy: new Map(),
  nodeSize: { width: 100, height: 50 },
  width: 500,
  height: 500
} as any;

const sourcePt = { x: 150, y: -100 };
const targetPt1 = { x: 75, y: 75 };

const path1 = routeEdgeOrthogonal(sourcePt, targetPt1, layout, 0, 0, 3, 1);
console.log("path1:", path1);

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

// We will overwrite console.log in layout.ts later, but for now let's just see if astar is running properly.
// The fallback path is:
// [sourcePt, {x: sourcePt.x, y: allowedY1}, {x: targetPt.x, y: allowedY2}, targetPt]
// For path1, allowedY1 = -100 + 20 = -80
// allowedY2 = 75 - 20 = 55
// fallback = [{x: 150, y: -100}, {x: 150, y: -80}, {x: 75, y: 55}, {x: 75, y: 75}]
// This is exactly what was returned!

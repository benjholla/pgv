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
const targetPt2 = { x: 175, y: 75 };
const targetPt3 = { x: 275, y: 75 };

const path1 = routeEdgeOrthogonal(sourcePt, targetPt1, layout, 0, 0, 3, 1);
const path2 = routeEdgeOrthogonal(sourcePt, targetPt2, layout, 1, 0, 3, 1);
const path3 = routeEdgeOrthogonal(sourcePt, targetPt3, layout, 2, 0, 3, 1);

console.log("targetPt1.y:", targetPt1.y);
console.log("path1:", path1);
console.log("path2:", path2);
console.log("path3:", path3);

// Let's modify allowedY2 in layout.ts or here just to see what happens if targetPt.y has staggering.
// In the current layout.ts logic:
// const maxRequiredTarget = minOffset + (inTotal - 1) * spacing;
// let targetVerticalOffset = minOffset + inIndex * spacing;
// Here inIndex is 0 and inTotal is 1 for all paths, so targetVerticalOffset = minOffset (20)
// allowedY2 = targetPt.y - 20 = 75 - 20 = 55.
// allowedY1 for path1: outIndex=0, outTotal=3 -> offset = 20. allowedY1 = -100 + 20 = -80.
// allowedY1 for path2: outIndex=1, outTotal=3 -> offset = 35. allowedY1 = -100 + 35 = -65.
// allowedY1 for path3: outIndex=2, outTotal=3 -> offset = 50. allowedY1 = -100 + 50 = -50.

// The horizontal segments from allowedY1 (source side) might not overlap because allowedY1 are different.
// BUT the horizontal segments from allowedY2 (target side) DO overlap!
// path1 goes down to allowedY2=55, then horizontal to x=75, then down to y=75.
// path2 goes down to allowedY2=55, then horizontal to x=175, then down to y=75.
// path3 goes down to allowedY2=55, then horizontal to x=275, then down to y=75.

// All of them have a horizontal line on y=55!

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

console.log("path1:", path1);
console.log("path2:", path2);
console.log("path3:", path3);

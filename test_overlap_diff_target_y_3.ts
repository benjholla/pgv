// Wait, my tests showed that it WAS falling back.
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

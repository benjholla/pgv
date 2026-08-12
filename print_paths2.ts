import { routeEdgeOrthogonal } from "./src/layout";
import { Point } from "./src/model";

function segmentsOverlap(pathA: readonly Point[], pathB: readonly Point[]): boolean {
  for (let i = 1; i < pathA.length; i++) {
    const a1 = pathA[i - 1];
    const a2 = pathA[i];

    for (let j = 1; j < pathB.length; j++) {
      const b1 = pathB[j - 1];
      const b2 = pathB[j];

      if (a1.x === a2.x && b1.x === b2.x && a1.x === b1.x) {
        const aMin = Math.min(a1.y, a2.y);
        const aMax = Math.max(a1.y, a2.y);
        const bMin = Math.min(b1.y, b2.y);
        const bMax = Math.max(b1.y, b2.y);
        if (Math.max(aMin, bMin) < Math.min(aMax, bMax)) {
          return true;
        }
      }

      if (a1.y === a2.y && b1.y === b2.y && a1.y === b1.y) {
        const aMin = Math.min(a1.x, a2.x);
        const aMax = Math.max(a1.x, a2.x);
        const bMin = Math.min(b1.x, b2.x);
        const bMax = Math.max(b1.x, b2.x);
        if (Math.max(aMin, bMin) < Math.min(aMax, bMax)) {
          return true;
        }
      }
    }
  }
  return false;
}

const parentId = "parent";

const layout = {
  positions: new Map([
    [parentId, { x: 0, y: 0 }],
    ["child1", { x: 50, y: 50 }],
    ["child2", { x: 150, y: 50 }],
    ["child3", { x: 250, y: 50 }]
  ]),
  nodeSizes: new Map([
    [parentId, { width: 350, height: 150 }],
    ["child1", { width: 50, height: 50 }],
    ["child2", { width: 50, height: 50 }],
    ["child3", { width: 50, height: 50 }]
  ]),
  hierarchy: new Map([
    [parentId, { children: ["child1", "child2", "child3"], parent: null }],
    ["child1", { children: [], parent: parentId }],
    ["child2", { children: [], parent: parentId }],
    ["child3", { children: [], parent: parentId }]
  ]),
  nodeSize: { width: 100, height: 50 },
  width: 500,
  height: 500
} as any;

const sourcePt = { x: 150, y: -100 };
const targetPt1 = { x: 75, y: 75 }; // Center of child1
const targetPt2 = { x: 175, y: 75 }; // Center of child2
const targetPt3 = { x: 275, y: 75 }; // Center of child3

const path1 = routeEdgeOrthogonal(sourcePt, targetPt1, layout, 0, 0, 3, 1);
const path2 = routeEdgeOrthogonal(sourcePt, targetPt2, layout, 1, 0, 3, 1);
const path3 = routeEdgeOrthogonal(sourcePt, targetPt3, layout, 2, 0, 3, 1);

console.log("overlap12:", segmentsOverlap(path1, path2));
console.log("overlap23:", segmentsOverlap(path2, path3));
console.log("overlap13:", segmentsOverlap(path1, path3));

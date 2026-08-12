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

const path1 = [
  { x: 150, y: -100 },
  { x: 150, y: -80 },
  { x: 75, y: 55 },
  { x: 75, y: 75 }
]
const path2 = [
  { x: 150, y: -100 },
  { x: 150, y: -65 },
  { x: 175, y: 55 },
  { x: 175, y: 75 }
]
const path3 = [
  { x: 150, y: -100 },
  { x: 150, y: -50 },
  { x: 275, y: 55 },
  { x: 275, y: 75 }
]

console.log("overlap12:", segmentsOverlap(path1, path2));
console.log("overlap23:", segmentsOverlap(path2, path3));
console.log("overlap13:", segmentsOverlap(path1, path3));

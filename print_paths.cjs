const { routeEdgeOrthogonal } = require("./src/layout");

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
};

const sourcePt = { x: 150, y: -100 };
const targetPt1 = { x: 75, y: 75 }; // Center of child1
const targetPt2 = { x: 175, y: 75 }; // Center of child2
const targetPt3 = { x: 275, y: 75 }; // Center of child3

const path1 = routeEdgeOrthogonal(sourcePt, targetPt1, layout, 0, 0, 3, 1);
const path2 = routeEdgeOrthogonal(sourcePt, targetPt2, layout, 1, 0, 3, 1);
const path3 = routeEdgeOrthogonal(sourcePt, targetPt3, layout, 2, 0, 3, 1);

console.log("path1:", path1);
console.log("path2:", path2);
console.log("path3:", path3);

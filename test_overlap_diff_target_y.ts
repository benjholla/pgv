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

// If they are horizontally aligned (same target y), they overlap on allowedY2 because inIndex is 0 and inTotal is 1 for each child node.
// To fix this, we need to stagger allowedY2 even if they go to different target nodes!
// But `inIndex` and `inTotal` only describe edges entering the SAME target node.
// These edges are entering DIFFERENT target nodes, but leaving the SAME source node.
// We stagger allowedY1 based on `outIndex` and `outTotal`.
// Why does path1 jump straight from {x: 150, y: -80} to {x: 75, y: 55}?
// That's a diagonal line! Wait, {x:150, y:-80} -> {x:75, y:55} is NOT orthogonal!
// Ah, the A* algorithm returned a compressed path, but let's look at the result.
// Wait, `{x: 150, y: -80}` to `{x: 75, y: 55}` is not orthogonal because x and y both change!

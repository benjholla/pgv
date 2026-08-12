import fs from "fs";
let content = fs.readFileSync("src/layout.ts", "utf-8");

// The overlap on vertical edges from sourcePt!
// path1: {x: 150, y: -100} -> {x: 150, y: -80}
// path2: {x: 150, y: -100} -> {x: 150, y: -65}
// They both share the segment x=150, y=-100 to y=-80!
// This is because the routing always starts exactly at `sourcePt`.
// But wait! If they are all coming from the exact same point `sourcePt` without source horizontal staggering...
// Is `sourcePt` horizontally staggered? No, `sourcePt` passed in is { x: 150, y: -100 }.
// In `edgeEndpoints`, we add `routing.sourceOffsetPx` to `source.x` to stagger it BEFORE passing to `routeEdgeOrthogonal`!
// Ah!!!
// In the test `test/layout/horizontal-routing-boundary.test.ts`, the source points are NOT staggered!
// It passes `const sourcePt = { x: 150, y: -100 };` to all three calls!

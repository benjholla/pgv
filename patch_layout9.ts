import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");

// The overlap test considers `{ x: 150, y: -100 }` to `{ x: 150, y: -80 }` as overlapping with `{ x: 150, y: -100 }` to `{ x: 150, y: -65 }`.
// Yes! They share the exact same start coordinate AND X coordinate AND overlap in Y!
// To fix this, `sourcePt` ITSELF must be staggered!
// But wait! `routeEdgeOrthogonal` takes `sourcePt` as an argument.
// In `edgeEndpoints`, we add `routing.sourceOffsetPx` to `sourcePt`.
// So in the real layout pipeline, `sourcePt` IS STAGGERED.
// Let's check `test/layout/horizontal-routing-boundary.test.ts`.
// It calls `routeEdgeOrthogonal(sourcePt, targetPt1, layout, 0, 0, 3, 1)` where `sourcePt` is hardcoded to `{ x: 150, y: -100 }` for all three edges!
// Ah! In the test, we mock `routeEdgeOrthogonal` but we DON'T mock `edgeEndpoints`.
// `edgeEndpoints` applies `routing.sourceOffsetPx`.
// Because the test hardcodes `sourcePt` to be the same, the first segment will ALWAYS overlap unless `sourcePt` is also staggered.
// Let's modify the test to stagger `sourcePt` just like `edgeEndpoints` does!

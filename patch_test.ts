import fs from "fs";

let content = fs.readFileSync("test/layout/horizontal-routing-boundary.test.ts", "utf-8");

content = content.replace(
  "    const sourcePt = { x: 150, y: -100 };",
  `    // In real layout, source endpoints are staggered using edgeRouting.sourceOffsetPx
    const spacing = 16;
    const sourcePt1 = { x: 150 - spacing, y: -100 };
    const sourcePt2 = { x: 150, y: -100 };
    const sourcePt3 = { x: 150 + spacing, y: -100 };`
);

content = content.replace(
  "    const path1 = routeEdgeOrthogonal(sourcePt, targetPt1, layout, 0, 0, 3, 1);\n    const path2 = routeEdgeOrthogonal(sourcePt, targetPt2, layout, 1, 0, 3, 1);\n    const path3 = routeEdgeOrthogonal(sourcePt, targetPt3, layout, 2, 0, 3, 1);",
  "    const path1 = routeEdgeOrthogonal(sourcePt1, targetPt1, layout, 0, 0, 3, 1);\n    const path2 = routeEdgeOrthogonal(sourcePt2, targetPt2, layout, 1, 0, 3, 1);\n    const path3 = routeEdgeOrthogonal(sourcePt3, targetPt3, layout, 2, 0, 3, 1);"
);

fs.writeFileSync("test/layout/horizontal-routing-boundary.test.ts", content);

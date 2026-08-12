import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");

// The problem is that when `routeEdgeOrthogonal` generates the grid and allowed offsets,
// it uses `inIndex` to stagger `targetVerticalOffset`.
// But when edges leave the SAME node (outTotal > 1) and enter horizontally aligned but DIFFERENT child nodes,
// `inTotal` for each child is 1, so `targetVerticalOffset` is not staggered.
// This causes all their target segments to use the EXACT SAME `allowedY2` horizontal coordinate.
// To satisfy the Horizontal Alignment Non-Overlap Property, we should ensure `targetVerticalOffset`
// incorporates staggering based on `outIndex` if `inTotal` is 1 but `outTotal` is > 1.
// Essentially: Math.max(inTotal, outTotal) and the corresponding index.

content = content.replace(
  "  const maxRequiredTarget = minOffset + (inTotal - 1) * spacing;\n  let targetVerticalOffset = minOffset + inIndex * spacing;\n  if (maxRequiredTarget > maxOffset && inTotal > 1) {\n    const availableStagger = Math.max(0, maxOffset - minOffset);\n    targetVerticalOffset = minOffset + inIndex * (availableStagger / (inTotal - 1));\n  } else {\n    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);\n  }",
  `  const effectiveInTotal = Math.max(inTotal, outTotal);
  const effectiveInIndex = outTotal > inTotal ? outIndex : inIndex;

  const maxRequiredTarget = minOffset + (effectiveInTotal - 1) * spacing;
  let targetVerticalOffset = minOffset + effectiveInIndex * spacing;
  if (maxRequiredTarget > maxOffset && effectiveInTotal > 1) {
    const availableStagger = Math.max(0, maxOffset - minOffset);
    targetVerticalOffset = minOffset + effectiveInIndex * (availableStagger / (effectiveInTotal - 1));
  } else {
    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);
  }`
);

fs.writeFileSync("src/layout.ts", content);

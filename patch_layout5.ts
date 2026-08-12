import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");

// When outTotal > 1 and inTotal == 1, we stagger the source, but NOT the target.
// BUT the test is verifying that paths to DIFFERENT horizontally aligned children do not perfectly overlap.
// And they overlap at `targetVerticalOffset`.
// Because `targetVerticalOffset` is calculated based on `inIndex` and `inTotal`, which are 0 and 1.
// So `targetVerticalOffset = minOffset`. All edges to horizontally aligned children will use `allowedY2` at `y = 75 - 20 = 55`.
// And since it's the A* fallback, it creates `[sourcePt, {x, y: allowedY1}, {x, y: allowedY2}, targetPt]`.
// If outTotal > 1, `allowedY1` is staggered. But the segment `{x: targetPt.x, y: allowedY2}` shares `y = 55` with other edges!
// To fix this, we should ALSO stagger the target if we are staggering the source, OR just use the max of (inIndex, outIndex) for BOTH staggering offsets?
// If we stagger `targetVerticalOffset` based on `outIndex` (if `outTotal > inTotal`), then `allowedY2` will be staggered.
// But wait, if they have different target nodes, `targetPt.y` is the same (horizontal alignment).
// If we just use `Math.max(inTotal, outTotal)` and `Math.max(inIndex, outIndex)` for BOTH offsets:
content = content.replace(
  "  const maxRequiredTarget = minOffset + (inTotal - 1) * spacing;\n  let targetVerticalOffset = minOffset + inIndex * spacing;\n  if (maxRequiredTarget > maxOffset && inTotal > 1) {\n    const availableStagger = Math.max(0, maxOffset - minOffset);\n    targetVerticalOffset = minOffset + inIndex * (availableStagger / (inTotal - 1));\n  } else {\n    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);\n  }",
  `  const effInTotal = Math.max(inTotal, outTotal);
  const effInIndex = outTotal > inTotal ? outIndex : inIndex;

  const maxRequiredTarget = minOffset + (effInTotal - 1) * spacing;
  let targetVerticalOffset = minOffset + effInIndex * spacing;
  if (maxRequiredTarget > maxOffset && effInTotal > 1) {
    const availableStagger = Math.max(0, maxOffset - minOffset);
    targetVerticalOffset = minOffset + effInIndex * (availableStagger / (effInTotal - 1));
  } else {
    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);
  }`
);

fs.writeFileSync("src/layout.ts", content);

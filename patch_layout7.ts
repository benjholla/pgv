import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");
content = content.replace(
  "  const effInTotal = Math.max(inTotal, outTotal);\n  const effInIndex = outTotal > inTotal ? outIndex : inIndex;\n\n  const maxRequiredTarget = minOffset + (effInTotal - 1) * spacing;\n  let targetVerticalOffset = minOffset + effInIndex * spacing;\n  if (maxRequiredTarget > maxOffset && effInTotal > 1) {\n    const availableStagger = Math.max(0, maxOffset - minOffset);\n    targetVerticalOffset = minOffset + effInIndex * (availableStagger / (effInTotal - 1));\n  } else {\n    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);\n  }",
  `  const effectiveInTotal = Math.max(inTotal, outTotal);
  const effectiveInIndex = inTotal > 1 ? inIndex : outIndex;

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

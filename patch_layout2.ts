import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");

// Change targetVerticalOffset logic to stagger even if inTotal is 1, but we have multiple outEdges.
// If outTotal > 1, the paths might still need staggering at the target end if they go to same Y level.
// However, the cleanest way to stagger horizontally aligned targets is to fallback to using outIndex when inTotal == 1.
// If inTotal == 1 and outTotal > 1, stagger target by outIndex.
// Or better yet, we can stagger target by whichever is larger: inIndex or outIndex.

content = content.replace(
  "  const maxRequiredTarget = minOffset + (inTotal - 1) * spacing;\n  let targetVerticalOffset = minOffset + inIndex * spacing;\n  if (maxRequiredTarget > maxOffset && inTotal > 1) {\n    const availableStagger = Math.max(0, maxOffset - minOffset);\n    targetVerticalOffset = minOffset + inIndex * (availableStagger / (inTotal - 1));\n  } else {\n    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);\n  }",
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

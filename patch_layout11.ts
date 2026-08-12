import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");

// But wait, if `maxOffset < 0`, `sourceVerticalOffset` could become negative if it falls into `Math.min(sourceVerticalOffset, maxOffset)`.
// If physicalSpace is 0, `physicalSpace > 0` is false, so `maxOffset = Infinity`, which is fine, it goes around.
// If physicalSpace is 5, `maxOffset = -2.5`.
// `sourceVerticalOffset = Math.min(20, -2.5) = -2.5`.
// Then `allowedY1 = sourcePt.y - 2.5`.
// Wait, `sourceVerticalOffset` shouldn't be negative, or it will draw the line backwards into the source node!
// If `physicalSpace` is extremely small (like 5), the nodes are basically overlapping vertically anyway.
// A safe bound for `maxOffset` is `Math.max(0, (physicalSpace - 10) / 2)`.
// Actually, `Math.max(minOffset, (physicalSpace / 2) - 4)` was probably there for a reason, to ensure a minimum offset if possible.
// Wait! If `(physicalSpace / 2) - 4` was used, and `physicalSpace = 100`, `maxOffset = 46`.
// The user asks for a 10px min vertical margin between the horizontal edge segments.
// The distance is `physicalSpace - (sourceVerticalOffset + targetVerticalOffset)`.
// If we want this to be >= 10, then `sourceVerticalOffset + targetVerticalOffset <= physicalSpace - 10`.
// Let's modify the default assignment:
content = content.replace(
  "  if (physicalSpace > 0) {\n    maxOffset = (physicalSpace - 10) / 2;\n  }",
  `  if (physicalSpace > 0) {
    maxOffset = Math.max(0, (physicalSpace - 10) / 2);
  }`
);

fs.writeFileSync("src/layout.ts", content);

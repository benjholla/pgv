import fs from "fs";

// If physical space is 40, maxOffset = Math.max(20, 20 - 4) = 20.
// Then allowedY1 = 0 + 20 = 20.
// allowedY2 = 40 - 20 = 20.
// So allowedY1 === allowedY2 = 20.
// The horizontal edge segments touch (exactly 0 pixels between them).
// The user wants a 10px min vertical margin between the horizontal edge segments.
// That means `allowedY2 - allowedY1 >= 10`.
// `(targetPt.y - targetVerticalOffset) - (sourcePt.y + sourceVerticalOffset) >= 10`.
// `physicalSpace - (sourceVerticalOffset + targetVerticalOffset) >= 10`.
// To ensure this, `sourceVerticalOffset + targetVerticalOffset <= physicalSpace - 10`.
// If they are symmetrical, `maxOffset <= (physicalSpace - 10) / 2`.
// We can change:
// `maxOffset = Math.max(minOffset, (physicalSpace / 2) - 4);`
// to:
// `maxOffset = Math.max(minOffset, (physicalSpace - 10) / 2);`
// But wait, what if `physicalSpace < 50`?
// If `physicalSpace = 40`, `(40 - 10)/2 = 15`.
// Then `Math.max(20, 15)` is STILL 20.
// If it's 20, then they will still sum to 40, and touch exactly.
// To fix this, `maxOffset` MUST NOT use `Math.max(minOffset, ...)` if it violates the 10px margin!
// But if `maxOffset` goes below `minOffset` (20), then we are staggering LESS than 20px from the node body, which might make the lines draw inside the node (if the node margin is larger than maxOffset).
// However, `minOffset = 20` is just a default spacing from the port.
// If the nodes are extremely close (e.g. `physicalSpace < 50`), we have to reduce the offset to prevent overlap.
// In fact, `maxOffset` shouldn't have a `Math.max(minOffset, ...)` lower bound if it means breaking the 10px gap!
// We can do: `maxOffset = (physicalSpace - 10) / 2;`
// Wait! If `physicalSpace` is negative, `maxOffset` becomes negative!
// If `physicalSpace <= 0`, it goes around the node anyway.
// Let's modify the line `if (physicalSpace > 0)`:

let content = fs.readFileSync("src/layout.ts", "utf-8");

content = content.replace(
  "  if (physicalSpace > 0) {\n    maxOffset = Math.max(minOffset, (physicalSpace / 2) - 4);\n  }",
  `  if (physicalSpace > 0) {
    maxOffset = (physicalSpace - 10) / 2;
  }`
);

fs.writeFileSync("src/layout.ts", content);

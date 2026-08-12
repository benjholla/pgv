import fs from "fs";
let content = fs.readFileSync("src/layout.ts", "utf-8");

// The user is asking for a min space of 10px between the horizontal edge segments.
// And they said "right now its exactly 0 pixels".
// Which means the horizontal edges are sharing the same Y line!
// Wait! I ALREADY changed it to `Math.max(inTotal, outTotal)`!
// That makes them NOT share the same Y line. They are staggered by 15px!
// So they DO NOT have 0 pixels space between them. They have 15 pixels space between them!
// What if the user is reviewing the PR that I ALREADY modified, but they are looking at the vertical spacing?
// The vertical spacing `spacing = 15;` is used.
// If the vertical spacing is 15px, the gap between lines is 15px.
// Wait... if they are staggered, the gap is 15px!
// "this is an improvement, but there should be a little min space between the horizontal edges and right now its exactly 0 pixels (the edges are not overlapped but touching). Could we add like 10px min vertical margin on the horizontal edge segments?"
// "the edges are not overlapped but touching"
// Could it be that the nodes themselves are too close?
// If the `maxOffset` is clamping the offset so that `targetVerticalOffset + sourceVerticalOffset = physicalSpace`?
// Yes! If `targetVerticalOffset + sourceVerticalOffset == physicalSpace`, then `allowedY1 === allowedY2`.
// THEN they touch!
// To add a 10px min vertical margin on the horizontal edge segments:
// That means `allowedY2 - allowedY1 >= 10`.
// Which means `(targetPt.y - targetVerticalOffset) - (sourcePt.y + sourceVerticalOffset) >= 10`
// `physicalSpace - targetVerticalOffset - sourceVerticalOffset >= 10`
// `targetVerticalOffset + sourceVerticalOffset <= physicalSpace - 10`.
// But `maxOffset` clamps `sourceVerticalOffset` and `targetVerticalOffset`.
// If `maxOffset = (physicalSpace - 10) / 2`, then `targetVerticalOffset <= maxOffset`, `sourceVerticalOffset <= maxOffset`.
// Then their sum is `<= physicalSpace - 10`.
// Therefore `allowedY2 - allowedY1 >= 10`!
// Which is exactly what the user is asking for!

content = content.replace(
  "  if (physicalSpace > 0) {\n    maxOffset = Math.max(minOffset, (physicalSpace / 2) - 4);\n  }",
  `  if (physicalSpace > 0) {
    maxOffset = Math.max(0, (physicalSpace - 10) / 2);
  }`
);

fs.writeFileSync("src/layout.ts", content);

import fs from "fs";

let content = fs.readFileSync("test/layout/horizontal-routing-boundary.test.ts", "utf-8");

content = content.replace(
  "it(\"Horizontal Alignment Non-Overlap Property: Paths to horizontally aligned children do not perfectly overlap (KNOWN BUG)\", () => {",
  "it(\"Horizontal Alignment Non-Overlap Property: Paths to horizontally aligned children do not perfectly overlap\", () => {"
);

fs.writeFileSync("test/layout/horizontal-routing-boundary.test.ts", content);

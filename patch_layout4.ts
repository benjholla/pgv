import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");

content = content.replace(
  "if (outIndex > inIndex && y1 === allowedY2) penalty += 10;",
  "if (outIndex > inIndex && y1 === allowedY2) penalty += 1000;"
).replace(
  "else if (inIndex > outIndex && y1 === allowedY1) penalty += 10;",
  "else if (inIndex > outIndex && y1 === allowedY1) penalty += 1000;"
).replace(
  "else if (outIndex === inIndex && y1 === allowedY2) penalty += 10;",
  "else if (outIndex === inIndex && y1 === allowedY2) penalty += 1000;"
);

fs.writeFileSync("src/layout.ts", content);

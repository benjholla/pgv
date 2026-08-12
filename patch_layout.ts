import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");
content = content.replace(
  "return Object.freeze([",
  "console.log('FALLBACK HIT'); return Object.freeze(["
);
fs.writeFileSync("src/layout.ts", content);

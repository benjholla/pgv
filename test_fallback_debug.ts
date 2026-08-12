import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");
content = content.replace(
  "        if (nxIdx === endXIdx && nyIdx === endYIdx) {",
  "        if (nxIdx === endXIdx && nyIdx === endYIdx) {\nconsole.log(`reaching target: curr.xIdx=${curr.xIdx} nxIdx=${nxIdx} curr.yIdx=${curr.yIdx} nyIdx=${nyIdx} dx=${dx} dy=${dy}`);"
);
content = content.replace(
  "        if (!isSegmentValid(x1, y1, x2, y2)) continue;",
  "        if (!isSegmentValid(x1, y1, x2, y2)) { /* console.log('segment invalid:', x1, y1, x2, y2); */ continue; }"
);
fs.writeFileSync("src/layout.ts", content);

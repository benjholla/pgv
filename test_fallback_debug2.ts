import fs from "fs";

let content = fs.readFileSync("src/layout.ts", "utf-8");
content = content.replace(
  "        if (nxIdx === endXIdx && nyIdx === endYIdx) {",
  "        if (nxIdx === endXIdx && nyIdx === endYIdx) {\nconsole.log(`reaching target: dx=${dx} dy=${dy} curr=${curr.xIdx},${curr.yIdx} n=${nxIdx},${nyIdx} y1=${yCoords[curr.yIdx]} y2=${yCoords[nyIdx]}`);"
);
content = content.replace(
  "             } else {",
  "             } else {\nconsole.log('REJECTED TARGET REACH:', dx, dy);"
);
fs.writeFileSync("src/layout.ts", content);

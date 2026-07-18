const fs = require('fs');

let benchCode = `import { bench, describe } from "vitest";

const containment = ["parent", "child", "container", "module", "folder"];
const tags = ["action", "event", "container", "node", "root"];

const containmentSet = new Set(containment);

describe("includes vs Set.has vs indexOf vs indexOf in Set", () => {
  bench("includes", () => {
    let has = false;
    for (let i = 0; i < tags.length; i++) {
      if (containment.includes(tags[i])) {
        has = true;
        break;
      }
    }
  });

  bench("Set.has", () => {
    let has = false;
    for (let i = 0; i < tags.length; i++) {
      if (containmentSet.has(tags[i])) {
        has = true;
        break;
      }
    }
  });
});
`;

fs.writeFileSync('bench/bench-includes.bench.ts', benchCode, 'utf8');

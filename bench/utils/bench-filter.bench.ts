import { bench, describe } from "vitest";

describe("filter vs loop for array construction", () => {
  const map = new Map();
  for (let i = 0; i < 20000; i++) {
    map.set(String(i), i % 2 === 0 ? [] : ["some"]);
  }
  const nodeIds = Array.from(map.keys());
  const incoming = map;

  bench("filter", () => {
    const roots = nodeIds.filter((id) => incoming.get(id)!.length === 0);
    return roots.length;
  });

  bench("for loop", () => {
    const roots = [];
    for(let i=0; i < nodeIds.length; i++) {
        const id = nodeIds[i];
        if (incoming.get(id)!.length === 0) {
            roots.push(id);
        }
    }
    return roots.length;
  });
});

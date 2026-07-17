import { bench, describe } from "vitest";

describe("validateStructuralInvariants edge iterator", () => {
  const edgeArray = [];
  for (let i = 0; i < 50000; i++) {
    edgeArray.push({ id: String(i), source: "1", target: "2", tags: [] });
  }

  function* generateEdges() {
    for (const e of edgeArray) {
        yield e;
    }
  }

  bench("Array.from(edges)", () => {
    const edges = generateEdges();
    const edgeList = Array.from(edges);
    let c = 0;
    for (const e of edgeList) {
        c++;
    }
    return c;
  });

  bench("for...of edges (no array allocation)", () => {
    const edges = generateEdges();
    let c = 0;
    for (const e of edges) {
        c++;
    }
    return c;
  });
});

import { bench, describe } from "vitest";
import { createGraphSnapshot } from "../../src/model";
import { computeLayout } from "../../src/layout";

describe("layout foreach vs for loop", () => {
  const nodes = [];
  const edges = [];
  for (let i = 0; i < 5000; i++) {
    nodes.push({ id: `node-${i}`, tags: [] });
    if (i > 0) {
      edges.push({ id: `edge-${i}`, source: `node-${i-1}`, target: `node-${i}`, tags: [] });
    }
  }

  const snapshot = createGraphSnapshot({
    graphId: "test",
    version: 1,
    nodes,
    edges
  });

  bench("computeLayout", () => {
    computeLayout(snapshot);
  });
});

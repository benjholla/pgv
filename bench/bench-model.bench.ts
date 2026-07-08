import { bench, describe } from "vitest";
import { createGraphSnapshot, applyGraphDiff, createGraphDiff, graphSnapshotToJson, type GraphSnapshotJson } from "../src/model";

function generateLargeGraph(numNodes: number, edgesPerNode: number): GraphSnapshotJson {
  const nodes = [];
  const edges = [];
  nodes.push({ id: `n_root`, tags: ["test"], attributes: { val: { integer: -1 } } });
  for (let i = 0; i < numNodes; i++) {
    nodes.push({ id: `n${i}`, tags: ["test"], attributes: { val: { integer: i } }, parent: i % 2 === 0 ? "n_root" : undefined });
    for (let j = 0; j < edgesPerNode; j++) {
      const target = (i + j + 1) % numNodes;
      edges.push({ id: `e${i}-${target}`, source: `n${i}`, target: `n${target}` });
    }
  }
  return { graphId: "bench", version: 1, nodes, edges };
}

describe("model performance", () => {
  const largeGraphData = generateLargeGraph(10000, 2); // 10k nodes, 20k edges
  const largeSnapshot = createGraphSnapshot(largeGraphData);

  const diffData = {
    addedNodes: [{ id: "n_new", tags: ["new"], attributes: {} }],
    addedEdges: [{ id: "e_new", source: "n0", target: "n_new" }],
    removedNodes: ["n1"],
    removedEdges: ["e1-2", "e1-3"] // just guessing some edge ids based on logic
  };
  const diff = createGraphDiff(diffData);

  bench("createGraphSnapshot (10k nodes, 20k edges)", () => {
    createGraphSnapshot(largeGraphData);
  });

  bench("applyGraphDiff (on 10k/20k graph)", () => {
    applyGraphDiff(largeSnapshot, diff, 2);
  });

  bench("graphSnapshotToJson (on 10k/20k graph)", () => {
    graphSnapshotToJson(largeSnapshot);
  });
});

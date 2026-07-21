import { bench, describe } from "vitest";
import { createGraphSnapshot, type GraphSnapshotJson } from "../../src/model";
import { verticalLayout } from "../../src/layout";

function generateDeepGraph(depth: number, branchesPerNode: number): GraphSnapshotJson {
  const nodes = [];
  const edges = [];
  let nextId = 0;

  function createLevel(currentDepth: number, parentId?: string) {
    if (currentDepth > depth) return;

    const currentId = `n${nextId++}`;
    nodes.push({ id: currentId, tags: ["level"], attributes: { d: { integer: currentDepth } } });

    if (parentId !== undefined) {
      edges.push({ id: `e_${parentId}_${currentId}`, source: parentId, target: currentId });
    }

    for (let i = 0; i < branchesPerNode; i++) {
      createLevel(currentDepth + 1, currentId);
    }
  }

  createLevel(0);
  return { graphId: "bench-layout", version: 1, nodes, edges };
}

describe("layout performance (indexOf vs binarySearch)", () => {
  // Let's create a graph with nodes that have many edges to see the difference
  const data: GraphSnapshotJson = { graphId: "bench-layout", version: 1, nodes: [], edges: [] };
  const root = "n_root";
  data.nodes.push({ id: root, tags: [], attributes: {} });
  for (let i = 0; i < 5000; i++) {
    const child = `n_${i}`;
    data.nodes.push({ id: child, tags: [], attributes: {} });
    data.edges.push({ id: `e_${i}`, source: root, target: child });
  }

  const snapshot = createGraphSnapshot(data);

  bench("verticalLayout (star graph ~5k edges)", () => {
    verticalLayout(snapshot);
  });
});

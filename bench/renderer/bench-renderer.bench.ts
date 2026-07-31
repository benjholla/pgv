import { bench, describe } from "vitest";
import { GraphView } from "../../src/renderer";
import { createGraphSnapshot, type GraphSnapshotJson } from "../../src/model";

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
  return { graphId: "bench-renderer", version: 1, nodes, edges };
}

describe("renderer performance", () => {
  const graphData = generateDeepGraph(5, 3); // ~364 nodes
  const snapshot = createGraphSnapshot(graphData);

  // Set up container
  const container = document.createElement('div');
  document.body.appendChild(container);

  bench("render initial graph (DOM updates) ~364 nodes", () => {
    const view = new GraphView(container, {});
    view.setGraph(snapshot);
    view.destroy();
  });
});

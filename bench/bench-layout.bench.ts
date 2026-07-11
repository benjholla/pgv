import { bench, describe } from "vitest";
import { createGraphSnapshot, type GraphSnapshotJson } from "../src/model";
import { verticalLayout, edgeEndpoints } from "../src/layout";

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

describe("layout performance", () => {
  // Depth 6 with 3 branches = 1 + 3 + 9 + 27 + 81 + 243 + 729 = 1093 nodes
  const graphData = generateDeepGraph(6, 3);
  const snapshot = createGraphSnapshot(graphData);

  bench("verticalLayout (deep tree graph ~1k nodes)", () => {
    verticalLayout(snapshot);
  });

  const disconnectedData = generateDeepGraph(1, 0); // single node
  for(let i = 0; i < 1000; i++) {
    disconnectedData.nodes.push({id: `d${i}`, tags: [], attributes: {}});
  }
  const disconnectedSnapshot = createGraphSnapshot(disconnectedData);
  bench("verticalLayout (mostly disconnected ~1k nodes)", () => {
    verticalLayout(disconnectedSnapshot);
  });

  const wideData = generateDeepGraph(1, 10000); // 1 root, 10k branches
  const wideSnapshot = createGraphSnapshot(wideData);
  bench("verticalLayout (wide graph ~10k nodes)", () => {
    verticalLayout(wideSnapshot);
  });

  // For testing routing performance, we need a graph with some complexity
  const routingData = generateDeepGraph(4, 3); // ~121 nodes
  const routingSnapshot = createGraphSnapshot(routingData);
  const routingLayout = verticalLayout(routingSnapshot);

  bench("edgeEndpoints A* pathfinding (medium layout)", () => {
    for (const edge of routingSnapshot.edges.values()) {
      edgeEndpoints(edge, routingLayout);
    }
  });
});

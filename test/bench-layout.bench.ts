import { bench, describe } from 'vitest';
import { verticalLayout } from '../src/layout';
import type { Graph } from '../src/model';

function generateGraph(nodes: number, edgesPerNode: number): Graph {
  const graph: Graph = { nodes: new Map(), edges: new Map() };
  for (let i = 0; i < nodes; i++) {
    graph.nodes.set(`n${i}`, { id: `n${i}`, label: `Node ${i}`, type: 'node' });
  }
  for (let i = 0; i < nodes; i++) {
    for (let j = 0; j < edgesPerNode; j++) {
      const target = (i + j + 1) % nodes;
      graph.edges.set(`e${i}-${target}`, { id: `e${i}-${target}`, source: `n${i}`, target: `n${target}`, type: 'edge' });
    }
  }
  return graph;
}

const smallGraph = generateGraph(100, 2);
const mediumGraph = generateGraph(1000, 5);
const largeGraph = generateGraph(10000, 5);

describe('verticalLayout', () => {
  bench('small graph', () => {
    verticalLayout(smallGraph);
  });
  bench('medium graph', () => {
    verticalLayout(mediumGraph);
  });
  bench('large graph', () => {
    verticalLayout(largeGraph);
  });
});

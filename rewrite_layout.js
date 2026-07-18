import fs from 'fs';

const file = 'src/layout.ts';
let code = fs.readFileSync(file, 'utf8');

const identifyCompoundNodes = `
function identifyCompoundNodes(graph: GraphSnapshot, config: Required<VerticalLayoutOptions>) {
  const parentNodes = new Set<string>();
  for (const edge of graph.edges.values()) {
    for (let i = 0; i < edge.tags.length; i++) {
      if (config.containmentTags.has(edge.tags[i])) {
        parentNodes.add(edge.source);
        break;
      }
    }
  }

  const nodeIds = [];
  for (const id of graph.nodes.keys()) {
    if (!parentNodes.has(id)) {
      nodeIds.push(id);
    }
  }
  nodeIds.sort();

  return { nodeIds, parentNodes };
}
`;

// Append function to file
code += identifyCompoundNodes;
fs.writeFileSync(file, code);

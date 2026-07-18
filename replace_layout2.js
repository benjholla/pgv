import fs from 'fs';

const file = 'src/layout.ts';
let code = fs.readFileSync(file, 'utf8');

const buildAdjacencyLists = `
function buildAdjacencyLists(graph: GraphSnapshot, nodeIds: readonly string[], parentNodes: ReadonlySet<string>, config: Required<VerticalLayoutOptions>) {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const edgeOutgoing = new Map<string, string[]>();
  const edgeIncoming = new Map<string, string[]>();

  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
    edgeOutgoing.set(id, []);
    edgeIncoming.set(id, []);
  }

  for (const edge of graph.edges.values()) {
    let isContainment = false;
    for (let i = 0; i < edge.tags.length; i++) {
      if (config.containmentTags.has(edge.tags[i])) {
        isContainment = true;
        break;
      }
    }
    if (isContainment) {
      continue;
    }

    // Note: We always need to add to edgeOutgoing and edgeIncoming even if nodes are missing
    // or if it's a self loop, to maintain behavior of staggering calculation later.
    if (!edgeOutgoing.has(edge.source)) edgeOutgoing.set(edge.source, []);
    if (!edgeIncoming.has(edge.target)) edgeIncoming.set(edge.target, []);
    edgeOutgoing.get(edge.source)!.push(edge.id);
    edgeIncoming.get(edge.target)!.push(edge.id);

    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target) || parentNodes.has(edge.source) || parentNodes.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  }

  // Sort outgoing edges to guarantee deterministic traversal
  for (const neighbors of outgoing.values()) {
    neighbors.sort();
  }
  for (const list of edgeOutgoing.values()) {
    list.sort();
  }
  for (const list of edgeIncoming.values()) {
    list.sort();
  }

  return { outgoing, incoming, edgeOutgoing, edgeIncoming };
}
`;

code += buildAdjacencyLists;


const oldAdjacency = `  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const edgeOutgoing = new Map<string, string[]>();
  const edgeIncoming = new Map<string, string[]>();

  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
    edgeOutgoing.set(id, []);
    edgeIncoming.set(id, []);
  }

  for (const edge of graph.edges.values()) {
    let isContainment = false;
    for (let i = 0; i < edge.tags.length; i++) {
      if (config.containmentTags.has(edge.tags[i])) {
        isContainment = true;
        break;
      }
    }
    if (isContainment) {
      continue;
    }

    // Note: We always need to add to edgeOutgoing and edgeIncoming even if nodes are missing
    // or if it's a self loop, to maintain behavior of staggering calculation later.
    if (!edgeOutgoing.has(edge.source)) edgeOutgoing.set(edge.source, []);
    if (!edgeIncoming.has(edge.target)) edgeIncoming.set(edge.target, []);
    edgeOutgoing.get(edge.source)!.push(edge.id);
    edgeIncoming.get(edge.target)!.push(edge.id);

    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target) || parentNodes.has(edge.source) || parentNodes.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  }

  // Sort outgoing edges to guarantee deterministic traversal
  for (const neighbors of outgoing.values()) {
    neighbors.sort();
  }
  for (const list of edgeOutgoing.values()) {
    list.sort();
  }
  for (const list of edgeIncoming.values()) {
    list.sort();
  }`;

const newAdjacency = `  const { outgoing, incoming, edgeOutgoing, edgeIncoming } = buildAdjacencyLists(graph, nodeIds, parentNodes, config);`;

code = code.replace(oldAdjacency, newAdjacency);
fs.writeFileSync(file, code);

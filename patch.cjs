const fs = require('fs');
let code = fs.readFileSync('src/model.ts', 'utf8');

// Replace validateContainmentAcyclic definition
const vcaRegex = /function validateContainmentAcyclic\(nodes: Map<string, GraphNode>\) \{[\s\S]*?\}\n\}/;
const validateStructuralInvariantsStr = `function validateStructuralInvariants(
  nodes: Map<string, GraphNode>,
  edges: IterableIterator<GraphEdge>
) {
  for (const node of nodes.values()) {
    if (node.parent !== undefined && !nodes.has(node.parent)) {
      throw new GraphModelError(
        \`Node "\${node.id}" references missing parent "\${node.parent}".\`,
      );
    }
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();

  for (const startId of nodes.keys()) {
    if (visited.has(startId)) continue;

    let currentId: string | undefined = startId;
    const path = [];

    while (currentId !== undefined && !visited.has(currentId)) {
      if (visiting.has(currentId)) {
        throw new GraphModelError(\`Containment cycle detected involving node "\${currentId}".\`);
      }
      visiting.add(currentId);
      path.push(currentId);

      const node = nodes.get(currentId);
      currentId = node?.parent;
    }

    for (const id of path) {
      visiting.delete(id);
      visited.add(id);
    }
  }

  for (const edge of edges) {
    if (!nodes.has(edge.source)) {
      throw new GraphModelError(\`Edge "\${edge.id}" references missing source "\${edge.source}".\`);
    }
    if (!nodes.has(edge.target)) {
      throw new GraphModelError(\`Edge "\${edge.id}" references missing target "\${edge.target}".\`);
    }
  }
}`;
code = code.replace(vcaRegex, validateStructuralInvariantsStr);

// Replace usages in createGraphSnapshot
const createGraphSnapshotValidation = `  for (const node of nodes.values()) {
    if (node.parent !== undefined && !nodes.has(node.parent)) {
      throw new GraphModelError(
        \`Node "\${node.id}" references missing parent "\${node.parent}".\`,
      );
    }
  }

  validateContainmentAcyclic(nodes);

  for (const edge of input.edges) {
    const normalized = normalizeEdge(edge);

    if (edges.has(normalized.id)) {
      throw new GraphModelError(\`Duplicate edge id "\${normalized.id}".\`);
    }

    if (!nodes.has(normalized.source)) {
      throw new GraphModelError(
        \`Edge "\${normalized.id}" references missing source "\${normalized.source}".\`,
      );
    }

    if (!nodes.has(normalized.target)) {
      throw new GraphModelError(
        \`Edge "\${normalized.id}" references missing target "\${normalized.target}".\`,
      );
    }

    edges.set(normalized.id, normalized);
  }`;

const createGraphSnapshotValidationNew = `  for (const edge of input.edges) {
    const normalized = normalizeEdge(edge);

    if (edges.has(normalized.id)) {
      throw new GraphModelError(\`Duplicate edge id "\${normalized.id}".\`);
    }

    edges.set(normalized.id, normalized);
  }

  validateStructuralInvariants(nodes, edges.values());`;
code = code.replace(createGraphSnapshotValidation, createGraphSnapshotValidationNew);

// Replace usages in applyGraphDiff
const applyGraphDiffValidation = `  for (const node of nodes.values()) {
    if (node.parent !== undefined && !nodes.has(node.parent)) {
      throw new GraphModelError(
        \`Node "\${node.id}" references missing parent "\${node.parent}".\`,
      );
    }
  }

  validateContainmentAcyclic(nodes);

  for (const edge of edges.values()) {
    if (!nodes.has(edge.source)) {
      throw new GraphModelError(\`Edge "\${edge.id}" references missing source "\${edge.source}".\`);
    }
    if (!nodes.has(edge.target)) {
      throw new GraphModelError(\`Edge "\${edge.id}" references missing target "\${edge.target}".\`);
    }
  }`;
const applyGraphDiffValidationNew = `  validateStructuralInvariants(nodes, edges.values());`;
code = code.replace(applyGraphDiffValidation, applyGraphDiffValidationNew);

// Extract serialization methods
const serializationRegex1 = `    // We use a mutable type here to avoid spread operator allocations, then it gets implicitly cast.
    const n: { id: string; tags: readonly string[]; attributes: Readonly<Record<string, unknown>>; parent?: string } = {
      id: node.id,
      tags: node.tags,
      attributes: node.attributes,
    };
    if (node.parent !== undefined) {
      n.parent = node.parent;
    }
    nodes\\[i\\+\\+\\] = n as GraphNodeJson;`;

code = code.replace(new RegExp(serializationRegex1), `    nodes[i++] = nodeToJson(node);`);

const serializationRegex2 = `    edges\\[j\\+\\+\\] = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      tags: edge.tags,
      attributes: edge.attributes,
    };`;
code = code.replace(new RegExp(serializationRegex2), `    edges[j++] = edgeToJson(edge);`);


const serializationRegex3 = `    // PERF\\(Bolt\\): Replaced object spread syntax \\(\\.\\.\\.\\(condition \\? \\{ key: val \\} : \\{\\}\\)\\)
    // with explicit assignment to avoid excessive object allocations and GC churn
    // when processing a large number of nodes\\.
    const n: \\{ id: string; tags: readonly string\\[\\]; attributes: Readonly<Record<string, unknown>>; parent\\?: string \\} = \\{
      id: node\\.id,
      tags: node\\.tags,
      attributes: node\\.attributes,
    \\};
    if \\(node\\.parent !== undefined\\) \\{
      n\\.parent = node\\.parent;
    \\}
    addedNodes\\.push\\(n as GraphNodeJson\\);`;
code = code.replace(new RegExp(serializationRegex3), `    addedNodes.push(nodeToJson(node));`);

const serializationRegex4 = `    addedEdges\\.push\\(\\{
      id: edge\\.id,
      source: edge\\.source,
      target: edge\\.target,
      tags: edge\\.tags,
      attributes: edge\\.attributes,
    \\}\\);`;
code = code.replace(new RegExp(serializationRegex4), `    addedEdges.push(edgeToJson(edge));`);

const helpers = `
function nodeToJson(node: GraphNode): GraphNodeJson {
  // PERF(Bolt): Replaced object spread syntax (...(condition ? { key: val } : {}))
  // with explicit assignment to avoid excessive object allocations and GC churn
  // when processing a large number of nodes.
  const n: { id: string; tags: readonly string[]; attributes: Readonly<Record<string, unknown>>; parent?: string } = {
    id: node.id,
    tags: node.tags,
    attributes: node.attributes,
  };
  if (node.parent !== undefined) {
    n.parent = node.parent;
  }
  return n as GraphNodeJson;
}

function edgeToJson(edge: GraphEdge): GraphEdgeJson {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    tags: edge.tags,
    attributes: edge.attributes,
  };
}

export function applyGraphDiff`;
code = code.replace('export function applyGraphDiff', helpers);

fs.writeFileSync('src/model.ts', code);

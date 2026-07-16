const fs = require('fs');
let code = fs.readFileSync('src/model.ts', 'utf8');

// Replace createGraphSnapshot
const oldFunc = `export function createGraphSnapshot(input: GraphSnapshotJson): GraphSnapshot {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const containmentTags = new Set(input.schema?.containment ?? []);

  // Clone nodes to avoid mutating the original input if we need to add parents
  const processedNodes = input.nodes.map(n => ({ ...n }));
  const nodeMap = new Map(processedNodes.map(n => [n.id, n]));

  // Pre-process edges to infer parent relationships
  for (const edge of input.edges) {
    if (edge.tags && edge.tags.some(tag => containmentTags.has(tag))) {
      const targetNode = nodeMap.get(edge.target);
      if (targetNode && targetNode.parent === undefined) {
        targetNode.parent = edge.source;
      }
    }
  }

  for (const node of processedNodes) {
    const normalized = normalizeNode(node);`;

const newFunc = `export function createGraphSnapshot(input: GraphSnapshotJson): GraphSnapshot {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const containmentTags = new Set(input.schema?.containment ?? []);

  // Clone nodes to avoid mutating the original input if we need to add parents
  const processedNodes = new Array(input.nodes.length);
  for (let i = 0; i < input.nodes.length; i++) {
    const n = input.nodes[i];
    processedNodes[i] = {
      id: n.id,
      tags: n.tags,
      attributes: n.attributes,
    } as any;
    if (n.parent !== undefined) {
      processedNodes[i].parent = n.parent;
    }
  }
  const nodeMap = new Map();
  for (let i = 0; i < processedNodes.length; i++) {
    nodeMap.set(processedNodes[i].id, processedNodes[i]);
  }

  // Pre-process edges to infer parent relationships
  for (const edge of input.edges) {
    if (edge.tags) {
      for (let i = 0; i < edge.tags.length; i++) {
        if (containmentTags.has(edge.tags[i])) {
          const targetNode = nodeMap.get(edge.target);
          if (targetNode && targetNode.parent === undefined) {
            targetNode.parent = edge.source;
          }
          break; // Optimization: Found one containment tag, stop checking other tags
        }
      }
    }
  }

  for (let i = 0; i < processedNodes.length; i++) {
    const node = processedNodes[i];
    const normalized = normalizeNode(node);`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/model.ts', code);

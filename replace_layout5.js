import fs from 'fs';

const file = 'src/layout.ts';
let code = fs.readFileSync(file, 'utf8');

const computeEdgeRoutingHints = `
function computeEdgeRoutingHints(
  graph: GraphSnapshot,
  edgeOutgoing: ReadonlyMap<string, readonly string[]>,
  edgeIncoming: ReadonlyMap<string, readonly string[]>,
  config: Required<VerticalLayoutOptions>
) {
  const edgeRouting = new Map<string, EdgeRoutingHint>();
  const spacing = 16;
  const maxOffset = config.nodeWidth / 2 - 8;

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

    const outList = edgeOutgoing.get(edge.source) || [];
    const outIndex = binarySearch(outList, edge.id);
    const outTotal = outList.length;
    let sOffset = 0;
    if (outTotal > 1) {
      sOffset = (outIndex - (outTotal - 1) / 2) * spacing;
      sOffset = Math.max(-maxOffset, Math.min(maxOffset, sOffset));
    }

    const inList = edgeIncoming.get(edge.target) || [];
    const inIndex = binarySearch(inList, edge.id);
    const inTotal = inList.length;
    let tOffset = 0;
    if (inTotal > 1) {
      tOffset = (inIndex - (inTotal - 1) / 2) * spacing;
      tOffset = Math.max(-maxOffset, Math.min(maxOffset, tOffset));
    }

    edgeRouting.set(edge.id, Object.freeze({
      sourceOffsetPx: sOffset,
      targetOffsetPx: tOffset,
      outIndex,
      inIndex,
      outTotal,
      inTotal
    }));
  }

  return edgeRouting;
}
`;

code += computeEdgeRoutingHints;

const oldEdgeRouting = `  const edgeRouting = new Map<string, EdgeRoutingHint>();
  const spacing = 16;
  const maxOffset = config.nodeWidth / 2 - 8;

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

    const outList = edgeOutgoing.get(edge.source) || [];
    const outIndex = binarySearch(outList, edge.id);
    const outTotal = outList.length;
    let sOffset = 0;
    if (outTotal > 1) {
      sOffset = (outIndex - (outTotal - 1) / 2) * spacing;
      sOffset = Math.max(-maxOffset, Math.min(maxOffset, sOffset));
    }

    const inList = edgeIncoming.get(edge.target) || [];
    const inIndex = binarySearch(inList, edge.id);
    const inTotal = inList.length;
    let tOffset = 0;
    if (inTotal > 1) {
      tOffset = (inIndex - (inTotal - 1) / 2) * spacing;
      tOffset = Math.max(-maxOffset, Math.min(maxOffset, tOffset));
    }

    edgeRouting.set(edge.id, Object.freeze({
      sourceOffsetPx: sOffset,
      targetOffsetPx: tOffset,
      outIndex,
      inIndex,
      outTotal,
      inTotal
    }));
  }`;

const newEdgeRouting = `  const edgeRouting = computeEdgeRoutingHints(graph, edgeOutgoing, edgeIncoming, config);`;

code = code.replace(oldEdgeRouting, newEdgeRouting);
fs.writeFileSync(file, code);

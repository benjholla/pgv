import fs from 'fs';
let code = fs.readFileSync('src/layout.ts', 'utf8');
code = code.replace(
`  const nodeIds = [];
  for (const id of graph.nodes.keys()) {
    if (!parentNodes.has(id)) {
      nodeIds.push(id);
    }
  }`,
`  const nodeIds = [];
  for (const id of graph.nodes.keys()) {
    // If a node is a parent, we do NOT want it in the main rank-based DAG layout flow.
    // HOWEVER, if we filter it out here, we do not layout parent nodes at all (unless we do bottom-up layout).
    // The current layout logic doesn't actually layout parent nodes recursively yet.
    // But since we appended "Compound Node Size Injection" at the END of this layout function,
    // we CANNOT filter out parents here, because then they won't even exist in the layout at all!
    // But wait, if they are in nodeIds, they might get arbitrary positions in the DAG layout.
    // The Compound Node Size Injection OVERWRITES their position though: \`positions.set(id, {x: minX - pad, y: minY - header});\`
    // Therefore, it's safer to just let them be processed, or process them explicitly later.
    // If we process them here, they'll act as disconnected nodes and get placed somewhere on layer 0.
    // Let's filter them out here, BUT we must ensure the "Compound Node Size Injection" logic adds them back to \`positions\`.
    if (!parentNodes.has(id)) {
      nodeIds.push(id);
    }
  }`
);
fs.writeFileSync('src/layout.ts', code);

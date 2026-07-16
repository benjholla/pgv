const fs = require('fs');
let code = fs.readFileSync('src/layout.ts', 'utf8');

// Fix TypeError on line 274: edgeIncoming.get(edge.target)!.push(edge.id);
// because edge.target might not be in graph.nodes (missing node).
// So edgeIncoming won't have the entry for missing nodes.

const oldFunc = `    if (!hiddenNodes.has(edge.source)) {
      edgeOutgoing.get(edge.source)!.push(edge.id);
    }
    if (!hiddenNodes.has(edge.target)) {
      edgeIncoming.get(edge.target)!.push(edge.id);
    }`;

const newFunc = `    if (!hiddenNodes.has(edge.source) && edgeOutgoing.has(edge.source)) {
      edgeOutgoing.get(edge.source)!.push(edge.id);
    }
    if (!hiddenNodes.has(edge.target) && edgeIncoming.has(edge.target)) {
      edgeIncoming.get(edge.target)!.push(edge.id);
    }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/layout.ts', code);

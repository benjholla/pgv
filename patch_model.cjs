const fs = require('fs');
let code = fs.readFileSync('src/model.ts', 'utf8');

// The script replaced graphSnapshotToJson incorrectly.
// We need to fix the nodeToJson call in graphSnapshotToJson.
const regex = /const nodes = new Array\(snapshot\.nodes\.size\);\n  let i = 0;\n  for \(const node of snapshot\.nodes\.values\(\)\) \{\n    \/\/ We use a mutable type here to avoid spread operator allocations, then it gets implicitly cast\.\n    const n: \{ id: string; tags: readonly string\[\]; attributes: Readonly<Record<string, unknown>>; parent\?: string \} = \{\n      id: node\.id,\n      tags: node\.tags,\n      attributes: node\.attributes,\n    \};\n    if \(node\.parent !== undefined\) \{\n      n\.parent = node\.parent;\n    \}\n    nodes\[i\+\+\] = n as GraphNodeJson;\n  \}/;

code = code.replace(regex, `const nodes = new Array(snapshot.nodes.size);
  let i = 0;
  for (const node of snapshot.nodes.values()) {
    nodes[i++] = nodeToJson(node);
  }`);

fs.writeFileSync('src/model.ts', code);

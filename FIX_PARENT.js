import fs from 'fs';

let code = fs.readFileSync('src/layout.ts', 'utf8');

const regex = /const nodeIds = Array.from\(graph.nodes\.keys\(\)\)\.filter\(\(id\) => !parentNodes\.has\(id\)\);/g;
if (code.includes('const nodeIds = Array.from(graph.nodes.keys()).filter((id) => !parentNodes.has(id));')) {
  code = code.replace(regex, 'const nodeIds = Array.from(graph.nodes.keys()); // We want parent nodes to be laid out as well (but we might need to filter them from regular rank-based layout if they are containers, we will handle that in the hierarchy logic)');
  fs.writeFileSync('src/layout.ts', code);
  console.log("Replaced nodeIds filter");
} else {
  console.log("Could not find nodeIds filter");
}

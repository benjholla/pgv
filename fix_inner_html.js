const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// Instead of manual createElementNS for every SVG, which is tedious and error-prone,
// wait, the Sentinel instructions strictly say:
// "In @pgv/graph-core, strictly avoid using innerHTML to inject dynamic or static HTML strings into the DOM (e.g., for UI buttons or icons). Prefer constructing Node or HTMLElement objects programmatically and passing them to appendChild to proactively prevent potential DOM-based Cross-Site Scripting (XSS) vulnerabilities."

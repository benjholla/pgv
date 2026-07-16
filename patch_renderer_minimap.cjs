const fs = require('fs');
let code = fs.readFileSync('src/renderer.ts', 'utf8');

const oldFunc = `    // Draw edges
    ctx.lineWidth = 1;
    for (const edge of this.#graph.edges.values()) {
      const endpoints = edgeEndpoints(edge, layout);`;

const newFunc = `    // Draw edges
    ctx.lineWidth = 1;
    const containmentTags = new Set(this.#schema.containment ?? []);
    for (const edge of this.#graph.edges.values()) {
      let isContainment = false;
      for (let i = 0; i < edge.tags.length; i++) {
        if (containmentTags.has(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }
      if (isContainment) continue;

      const endpoints = edgeEndpoints(edge, layout);`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/renderer.ts', code);

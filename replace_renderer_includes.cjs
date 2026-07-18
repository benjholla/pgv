const fs = require('fs');

let modelCode = fs.readFileSync('src/model.ts', 'utf8');
let layoutCode = fs.readFileSync('src/layout.ts', 'utf8');
let rendererCode = fs.readFileSync('src/renderer.ts', 'utf8');

// Replace in layout.ts
const layoutOld = `    let isContainment = false;
    for (let i = 0; i < edge.tags.length; i++) {
      if (config.containmentTags.has(edge.tags[i])) {
        isContainment = true;
        break;
      }
    }`;

// Wait, the search strings were different. Let's look for them.

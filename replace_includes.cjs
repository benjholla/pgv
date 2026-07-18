const fs = require('fs');

let layoutCode = fs.readFileSync('src/layout.ts', 'utf8');

layoutCode = layoutCode.replace(
  `      let isContainment = false;
      for (let i = 0; i < edge.tags.length; i++) {
        if (schema.containment.includes(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }`,
  `      let isContainment = false;
      // PERF(Bolt): Optimize containment tag lookup
      if (schema.containment.length > 0) {
        for (let i = 0; i < edge.tags.length; i++) {
          if (schema.containment.includes(edge.tags[i])) {
            isContainment = true;
            break;
          }
        }
      }`
);

fs.writeFileSync('src/layout.ts', layoutCode, 'utf8');

let modelCode = fs.readFileSync('src/model.ts', 'utf8');

modelCode = modelCode.replace(
  `      let isContainment = false;
      for (let i = 0; i < edge.tags.length; i++) {
        if (schema.containment.includes(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }`,
  `      let isContainment = false;
      // PERF(Bolt): Optimize containment tag lookup
      if (schema.containment.length > 0) {
        for (let i = 0; i < edge.tags.length; i++) {
          if (schema.containment.includes(edge.tags[i])) {
            isContainment = true;
            break;
          }
        }
      }`
);

fs.writeFileSync('src/model.ts', modelCode, 'utf8');

let rendererCode = fs.readFileSync('src/renderer.ts', 'utf8');

rendererCode = rendererCode.replace(
  `    let isContainment = false;
    if (schema.containment) {
      for (let i = 0; i < edge.tags.length; i++) {
        if (schema.containment.includes(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }
    }`,
  `    let isContainment = false;
    if (schema.containment) {
      // PERF(Bolt): Optimize containment tag lookup
      for (let i = 0; i < edge.tags.length; i++) {
        if (schema.containment.includes(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }
    }`
);

fs.writeFileSync('src/renderer.ts', rendererCode, 'utf8');

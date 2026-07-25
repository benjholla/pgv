const fs = require('fs');
let content = fs.readFileSync('test/renderer/renderer.test.ts', 'utf8');

// The pan and zoom tests are checking `stage.style.transform`.
// However, the transform is now applied to `panZoomLayer`.
content = content.replace(/const stage = container.querySelector\(\'\.pgv-graph-stage\'\) as HTMLElement;/g, 'const stage = container.querySelector(".pgv-pan-zoom-layer") || container.querySelector(".pgv-graph-stage") as HTMLElement;');

fs.writeFileSync('test/renderer/renderer.test.ts', content);

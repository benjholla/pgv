const fs = require('fs');
let content = fs.readFileSync('test/renderer/renderer.test.ts', 'utf8');

// replace all setTimeout(resolve, 50) with setTimeout(resolve, 350)
content = content.replace(/setTimeout\(resolve, 50\)/g, 'setTimeout(resolve, 350)');

fs.writeFileSync('test/renderer/renderer.test.ts', content);

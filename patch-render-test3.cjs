const fs = require('fs');
let content = fs.readFileSync('test/renderer/renderer.test.ts', 'utf8');

// I will just replace ALL wait promises to wait at least 350ms so FLIP animations can clear up old nodes.
content = content.replace(/setTimeout\\(resolve, 50\\)/g, 'setTimeout(resolve, 350)');

fs.writeFileSync('test/renderer/renderer.test.ts', content);

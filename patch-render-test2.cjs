const fs = require('fs');
let content = fs.readFileSync('test/renderer/renderer.test.ts', 'utf8');

// When diff applies, during animation there are duplicate nodes for 300ms (old stage and new stage).
// The test uses 50ms wait.
content = content.replace(/await new Promise\\(resolve => setTimeout\\(resolve, 50\\)\\);/g, 'await new Promise(resolve => setTimeout(resolve, 350));');

fs.writeFileSync('test/renderer/renderer.test.ts', content);

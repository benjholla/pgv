const fs = require('fs');
const content = fs.readFileSync('src/layout.ts', 'utf8');
const search = '    const collapsedParents = [];';
const replace = '    const collapsedParents: string[] = [];';
const newContent = content.replace(search, replace);
fs.writeFileSync('src/layout.ts', newContent);

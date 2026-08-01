const fs = require('fs');
let content = fs.readFileSync('src/model.ts', 'utf8');

const oldRegexFix = `  finalHtml = finalHtml.replace(/<a\\s+((?:[^>"']|"[^"]*"|'[^']*')+?)(\\/?>)/gi, (match, attrsString, bracket) => {
    // 1. Tokenize attributes securely.
    const attrRegex = /([a-zA-Z0-9_-]+)(?:\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+))?/g;`;
const newRegexFix = `  // We capture the leading separator separately to preserve it.
  finalHtml = finalHtml.replace(/<a([\\s/])((?:[^>"']|"[^"]*"|'[^']*')+?)(\\/?>)/gi, (match, separator, attrsString, bracket) => {
    // 1. Tokenize attributes securely.
    const attrRegex = /([^\\s/=>]+)(?:\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+))?/g;`;

content = content.replace(oldRegexFix, newRegexFix);

const oldReturn = `    return \`<a \${newAttrsString}\${bracket}\`;`;
const newReturn = `    return \`<a\${separator}\${newAttrsString}\${bracket}\`;`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync('src/model.ts', content);
console.log('Successfully patched model');

import { readFileSync, writeFileSync } from 'fs';
let code = readFileSync('src/model.ts', 'utf8');
code = code.replace(
  'if (lower.includes("javascript:") || lower.includes("vbscript:") || lower.includes("data:text/html")) {',
  'if (lower.includes("javascript:") || lower.includes("vbscript:") || lower.includes("data:text/html")) {'
);
writeFileSync('src/model.ts', code);

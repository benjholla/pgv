const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

const helper = `
function createSvgElement(tag: string, attrs: Record<string, string>, children: Element[] = []): SVGElement {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  for (const child of children) {
    el.appendChild(child);
  }
  return el;
}
`;

content = content.replace('const PGV_VIEWPORT_CLASS = "pgv-viewport";', 'const PGV_VIEWPORT_CLASS = "pgv-viewport";\n' + helper);

fs.writeFileSync('src/renderer.ts', content);

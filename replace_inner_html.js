const fs = require('fs');

function createSvgElement(tag, attrs) {
  let code = `const svg = document.createElementNS("http://www.w3.org/2000/svg", "${tag}");\n`;
  for (const [key, value] of Object.entries(attrs)) {
    code += `svg.setAttribute("${key}", "${value}");\n`;
  }
  return code;
}

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// I will write a simple regex replacement or manually edit using vim/sed, wait, I can just create a helper function at the top of src/renderer.ts to parse HTML to DOM nodes or just manually use `document.createElementNS` for the svgs.

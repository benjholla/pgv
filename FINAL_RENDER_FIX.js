import fs from 'fs';

let code = fs.readFileSync('src/renderer.ts', 'utf8');

const regex = /title\.textContent = node\.id;/g;
if (code.match(regex)) {
   code = code.replace(regex, 'title.textContent = typeof node.attributes["XCSG.name"] === "string" ? node.attributes["XCSG.name"] : node.id;');
   fs.writeFileSync('src/renderer.ts', code);
   console.log("Updated title logic to use XCSG.name");
} else {
   console.log("Could not find block to replace");
}

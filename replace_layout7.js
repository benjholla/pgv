import fs from 'fs';

const file = 'src/layout.ts';
let code = fs.readFileSync(file, 'utf8');

const oldReturn = `    edgeRouting,
    hierarchy: hasHierarchy ? layoutHierarchy : undefined,
  });`;

const newReturn = `    edgeRouting,
    hierarchy,
  });`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync(file, code);

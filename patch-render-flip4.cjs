const fs = require('fs');
let content = fs.readFileSync('src/renderer.ts', 'utf8');

// Since DOM reflow needs the new nodes to be in the DOM to read getBoundingClientRect,
// we will structure the end of #render like this:
// this.container.replaceChildren(root);
// Then run the Step 2 and Step 3 of FLIP. Wait, if we replace root, oldStage is removed from DOM!
// So we must append oldStage to the new panZoomLayer inside root before replaceChildren.

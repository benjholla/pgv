const fs = require('fs');
let content = fs.readFileSync('src/renderer.ts', 'utf8');

// I'll make #render() accept a parameter `animate: boolean = false` to trigger the FLIP logic inside it.
// Wait, #render() does `this.container.replaceChildren(root);` which replaces everything.
// If animate is true, it shouldn't replace `root`. It should create the new stage, append it to `.pgv-pan-zoom-layer`, and handle the FLIP lifecycle.
// But `#render()` also renders controls, search bar, etc.

const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// I need to ensure the minimap is re-rendered during or after FLIP animations if necessary.
// Actually, `this.#render()` already calls `#drawMinimap` if minimap is open, wait, let me check.

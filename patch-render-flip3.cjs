const fs = require('fs');
let content = fs.readFileSync('src/renderer.ts', 'utf8');

// I notice my patch for the panZoomLayer appending earlier wasn't complete or got overwritten.
// Let's manually replace the block in `#render(animate: boolean = false)` where `viewport.appendChild(stage);` is.

const searchBlock = `    if (this.#options.usePanZoom || this.#options.useThemeToggle || (this.#options.maxHistory && this.#options.maxHistory > 0)) {
      const viewport = document.createElement("div");
      viewport.className = PGV_VIEWPORT_CLASS;

      stage.style.transform = \\\`translate(\\\${this.#viewportState.x}px, \\\${this.#viewportState.y}px) scale(\\\${this.#viewportState.scale})\\\`;
      stage.style.transformOrigin = "0 0";

      viewport.appendChild(stage);`;

const replaceBlock = `    if (this.#options.usePanZoom || this.#options.useThemeToggle || (this.#options.maxHistory && this.#options.maxHistory > 0)) {
      const viewport = document.createElement("div");
      viewport.className = PGV_VIEWPORT_CLASS;

      const panZoomLayer = document.createElement("div");
      panZoomLayer.className = "pgv-pan-zoom-layer";
      panZoomLayer.style.transform = \`translate(\${this.#viewportState.x}px, \${this.#viewportState.y}px) scale(\${this.#viewportState.scale})\`;

      panZoomLayer.appendChild(stage);
      viewport.appendChild(panZoomLayer);`;

content = content.replace(searchBlock, replaceBlock);

fs.writeFileSync('src/renderer.ts', content);

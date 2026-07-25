const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// replace the #render calls inside applyDiff, history navigate, and toggleNodeCollapse

// applyDiff (around line 349)
content = content.replace(
  `      this.#options.onGraphChange?.(this.#graph);\n      this.#render();`,
  `      this.#options.onGraphChange?.(this.#graph);\n      this.#render(true);`
);

// history navigation (around line 604)
content = content.replace(
  `    this.#options.onGraphChange?.(this.#graph);\n    this.#render();`,
  `    this.#options.onGraphChange?.(this.#graph);\n    this.#render(true);`
);

// toggleNodeCollapse (around line 652)
content = content.replace(
  `      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#schema);\n      this.#render();`,
  `      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#schema);\n      this.#render(true);`
);


fs.writeFileSync('src/renderer.ts', content);

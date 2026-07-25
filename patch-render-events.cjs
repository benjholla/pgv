const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// The instructions say: "Ensure static event listeners (#setupEvents) are strictly attached only during initial render (isInitialRender / #firstRender), not on dynamic update passes, to prevent memory/listener leaks."
// To do this, we can attach the events to `this.container` INSTEAD of `root`, and only do it if `this.#firstRender` is true.

// Change `#setupEvents` to attach to `this.container`:
const setupEventsSrc = `  #setupEvents(element: HTMLElement): void {`;
const setupEventsDest = `  #setupEvents(element: HTMLElement): void {`;

// In `#render()`, change `this.#setupEvents(root);` to `if (isInitialRender) { this.#setupEvents(this.container); }`
const searchSetupEvents = `    this.#setupEvents(root);`;
const replaceSetupEvents = `    if (isInitialRender) {\n      this.#setupEvents(this.container);\n    }`;

content = content.replace(searchSetupEvents, replaceSetupEvents);

// Also set `#firstRender = false` at the end of `#render()`
const searchEnd = `        toggle.focus();
      }
    }`;
const replaceEnd = `        toggle.focus();
      }
    }

    this.#firstRender = false;`;

content = content.replace(searchEnd, replaceEnd);

fs.writeFileSync('src/renderer.ts', content);

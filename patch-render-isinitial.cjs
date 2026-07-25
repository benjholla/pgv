const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// The error is `ReferenceError: isInitialRender is not defined`
// Looking at `#render(animate: boolean = false): void {`, `isInitialRender` is defined inside it!
// Oh wait, did my previous patch fail to define it because I only replaced the `const layout = this.#layout;` which might be further down? Let's check where it's defined.
// If not, I'll just change it to `this.#firstRender`.
content = content.replace(/if \(isInitialRender\) {/g, 'if (this.#firstRender) {');

fs.writeFileSync('src/renderer.ts', content);

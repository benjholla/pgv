const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// replace #render(): void { with #render(animate: boolean = false): void {
content = content.replace('  #render(): void {', '  #render(animate: boolean = false): void {');

fs.writeFileSync('src/renderer.ts', content);

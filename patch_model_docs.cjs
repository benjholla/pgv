const fs = require('fs');
let code = fs.readFileSync('src/model.ts', 'utf8');

const oldDocs = `/**
 * Applies a set of structural changes (\`GraphDiff\`) to an existing \`GraphSnapshot\`,
 * returning a new, immutable \`GraphSnapshot\`.
 *
 * This operation is functional; it does not mutate the original snapshot.
 *
 * @example
 * \`\`\`typescript
 * const nextSnapshot = applyGraphDiff(snapshot, diff);
 * console.log(nextSnapshot.nodes.has("C")); // true
 * console.log(nextSnapshot.edges.has("e1")); // false
 * \`\`\`
 *
 * @param snapshot The starting graph state.
 * @param diff The incremental changes to apply (removals happen before additions).
 * @returns A new, frozen \`GraphSnapshot\` incorporating the changes.
 * @throws {GraphModelError} If the diff introduces duplicate IDs or invalid references.
 */

function nodeToJson`;
const newDocs = `function nodeToJson`;
code = code.replace(oldDocs, newDocs);

fs.writeFileSync('src/model.ts', code);

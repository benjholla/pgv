const fs = require('fs');
let code = fs.readFileSync('src/layout.ts', 'utf8');

// I'll rewrite the sorting block cleanly to avoid the weird comment residue
const oldFunc = `      // Sort nodes in this layer by hintX, falling back to ID for determinism
      (ids as string[]).sort((a, b) => {
        const diff = hintX.get(a)! - hintX.get(b)!;
        if (diff === 0) {
          return a.localeCompare(b);
        }
        return diff;
      });
    }
  }

  // Sort nodes in each layer to group by parent hierarchy
  for (const ids of layers.values()) {
    (ids as string[]).sort((a, b) => {
      const getParentChain = (id: string) => {
        const chain: string[] = [];
        let curr = graph.nodes.get(id)?.parent;
        while (curr) {
          chain.unshift(curr); // root parent first
          curr = graph.nodes.get(curr)?.parent;
        }
        return chain.join(":");
      };

      const chainA = getParentChain(a);
      const chainB = getParentChain(b);

      if (chainA === chainB) {
        // If same parent, preserve the previous relative order (which is hintX or ID)
        // Since we are sorting the same array, we rely on stability.
        // Wait, native Array.sort is stable in modern JS, but let's be explicit just in case,
        // Actually since they were already sorted by hintX, we shouldn't ruin it.
        // Better: sort by chain first, then by existing order.
        return 0;
      }
      return chainA.localeCompare(chainB);
    });
  }`;

const newFunc = `      // Sort nodes in this layer by hintX, falling back to ID for determinism
      (ids as string[]).sort((a, b) => {
        const getParentChain = (id: string) => {
          let curr = graph.nodes.get(id)?.parent;
          if (!curr) return "";
          const chain: string[] = [];
          while (curr) {
            chain.unshift(curr); // root parent first
            curr = graph.nodes.get(curr)?.parent;
          }
          return chain.join(":");
        };

        const chainA = getParentChain(a);
        const chainB = getParentChain(b);

        if (chainA !== chainB) {
          return chainA.localeCompare(chainB);
        }

        const diff = hintX.get(a)! - hintX.get(b)!;
        if (diff === 0) {
          return a.localeCompare(b);
        }
        return diff;
      });
    }
  } else {
    // If no previous layout, still sort by parent chain to ensure grouping
    for (const ids of layers.values()) {
      (ids as string[]).sort((a, b) => {
        const getParentChain = (id: string) => {
          let curr = graph.nodes.get(id)?.parent;
          if (!curr) return "";
          const chain: string[] = [];
          while (curr) {
            chain.unshift(curr); // root parent first
            curr = graph.nodes.get(curr)?.parent;
          }
          return chain.join(":");
        };

        const chainA = getParentChain(a);
        const chainB = getParentChain(b);

        if (chainA !== chainB) {
          return chainA.localeCompare(chainB);
        }

        return a.localeCompare(b);
      });
    }
  }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/layout.ts', code);

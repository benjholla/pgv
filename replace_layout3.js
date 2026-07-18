import fs from 'fs';

const file = 'src/layout.ts';
let code = fs.readFileSync(file, 'utf8');

const applyPreviousLayoutHints = `
function applyPreviousLayoutHints(
  layers: ReadonlyMap<number, readonly string[]>,
  previousLayout: LayoutSnapshot,
  incoming: ReadonlyMap<string, readonly string[]>,
  outgoing: ReadonlyMap<string, readonly string[]>
) {
  for (const ids of layers.values()) {
    const hintX = new Map<string, number>();

    for (const id of ids) {
      if (previousLayout.positions.has(id)) {
        hintX.set(id, previousLayout.positions.get(id)!.x);
      } else {
        // Calculate average X of incoming neighbors
        let sumIn = 0;
        let countIn = 0;

        const inNeighbors = incoming.get(id) || [];
        for (const source of inNeighbors) {
          if (previousLayout.positions.has(source)) {
            sumIn += previousLayout.positions.get(source)!.x;
            countIn++;
          }
        }

        if (countIn > 0) {
          hintX.set(id, sumIn / countIn);
        } else {
          // Fall back to outgoing neighbors
          let sumOut = 0;
          let countOut = 0;
          const outNeighbors = outgoing.get(id) || [];
          for (const target of outNeighbors) {
            if (previousLayout.positions.has(target)) {
              sumOut += previousLayout.positions.get(target)!.x;
              countOut++;
            }
          }

          if (countOut > 0) {
            hintX.set(id, sumOut / countOut);
          } else {
            hintX.set(id, 0);
          }
        }
      }
    }

    // Sort nodes in this layer by hintX, falling back to ID for determinism
    (ids as string[]).sort((a, b) => {
      const diff = hintX.get(a)! - hintX.get(b)!;
      if (diff === 0) {
        return a.localeCompare(b);
      }
      return diff;
    });
  }
}
`;

code += applyPreviousLayoutHints;


const oldHints = `  if (previousLayout) {
    for (const ids of layers.values()) {
      const hintX = new Map<string, number>();

      for (const id of ids) {
        if (previousLayout.positions.has(id)) {
          hintX.set(id, previousLayout.positions.get(id)!.x);
        } else {
          // Calculate average X of incoming neighbors
          let sumIn = 0;
          let countIn = 0;

          const inNeighbors = incoming.get(id) || [];
          for (const source of inNeighbors) {
            if (previousLayout.positions.has(source)) {
              sumIn += previousLayout.positions.get(source)!.x;
              countIn++;
            }
          }

          if (countIn > 0) {
            hintX.set(id, sumIn / countIn);
          } else {
            // Fall back to outgoing neighbors
            let sumOut = 0;
            let countOut = 0;
            const outNeighbors = outgoing.get(id) || [];
            for (const target of outNeighbors) {
              if (previousLayout.positions.has(target)) {
                sumOut += previousLayout.positions.get(target)!.x;
                countOut++;
              }
            }

            if (countOut > 0) {
              hintX.set(id, sumOut / countOut);
            } else {
              hintX.set(id, 0);
            }
          }
        }
      }

      // Sort nodes in this layer by hintX, falling back to ID for determinism
      (ids as string[]).sort((a, b) => {
        const diff = hintX.get(a)! - hintX.get(b)!;
        if (diff === 0) {
          return a.localeCompare(b);
        }
        return diff;
      });
    }
  }`;

const newHints = `  if (previousLayout) {
    applyPreviousLayoutHints(layers, previousLayout, incoming, outgoing);
  }`;

code = code.replace(oldHints, newHints);
fs.writeFileSync(file, code);

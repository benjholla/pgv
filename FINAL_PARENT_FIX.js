import fs from 'fs';

let code = fs.readFileSync('src/layout.ts', 'utf8');

const replacement = `  // -- Start Compound Node Size Injection --
  const layoutHierarchy = new Map<string, { parent: string | null; children: string[] }>();
  for (const id of graph.nodes.keys()) {
    layoutHierarchy.set(id, { children: [], parent: null });
  }

  let hasHierarchy = false;
  if (schema?.containment) {
    hasHierarchy = true;
    for (const edge of graph.edges.values()) {
      let isContainment = false;
      for (let i = 0; i < edge.tags.length; i++) {
        if (schema.containment.includes(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }
      if (isContainment) {
        if (layoutHierarchy.has(edge.source) && layoutHierarchy.has(edge.target)) {
          layoutHierarchy.get(edge.source)!.children.push(edge.target);
          layoutHierarchy.get(edge.target)!.parent = edge.source;
        }
      }
    }

    const calcSize = (id: string): {w: number, h: number} => {
       const children = layoutHierarchy.get(id)?.children || [];
       if (children.length === 0) {
          const s = nodeSizes.get(id);
          if (s) return {w: s.width, h: s.height};
          const w = config.nodeWidth;
          const isCol = config.collapsedNodes?.has(id) ?? false;
          const h = isCol ? 36 : config.nodeHeight;
          nodeSizes.set(id, {width: w, height: h});
          return {w, h};
       }
       let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
       let hasChildren = false;
       for (const childId of children) {
          const p = positions.get(childId);
          if (p) {
             hasChildren = true;
             const s = calcSize(childId);
             if (p.x < minX) minX = p.x;
             if (p.x + s.w > maxX) maxX = p.x + s.w;
             if (p.y < minY) minY = p.y;
             if (p.y + s.h > maxY) maxY = p.y + s.h;
          }
       }
       if (hasChildren) {
          const pad = 20;
          const header = 40;
          const w = (maxX - minX) + pad * 2;
          const h = (maxY - minY) + header + pad;
          nodeSizes.set(id, {width: w, height: h});
          positions.set(id, {x: minX - pad, y: minY - header});

          // Make sure parent node is included in the output even if it wasn't processed by the main graph layout
          if (!positions.has(id)) {
              positions.set(id, {x: minX - pad, y: minY - header});
          }
          return {w, h};
       } else {
          // Empty parent node
          const w = config.nodeWidth;
          const h = config.nodeHeight;
          nodeSizes.set(id, {width: w, height: h});
          if (!positions.has(id)) {
             positions.set(id, {x: 0, y: 0}); // Fallback
          }
          return {w, h};
       }
    };

    for (const id of graph.nodes.keys()) {
       if (layoutHierarchy.get(id)?.parent === null) {
          calcSize(id);
       }
    }
  }
  // -- End Compound Node Size Injection --`;

const regex = /\/\/ -- Start Compound Node Size Injection --[\s\S]*?\/\/ -- End Compound Node Size Injection --/g;
if (code.match(regex)) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('src/layout.ts', code);
   console.log("Updated Compound Node Size Injection logic to ensure parent position fallback");
} else {
   console.log("Could not find block to replace");
}

const fs = require('fs');
let code = fs.readFileSync('src/layout.ts', 'utf8');

const oldFunc = `  for (const [depth, ids] of layers) {
    const layerWidth =
      config.nodeWidth + Math.max(0, ids.length - 1) * config.nodeSpacing;
    const startX = config.margin + (maxLayerWidth - layerWidth) / 2;
    const y = layerY.get(depth)!;

    for (let i = 0; i < ids.length; i++) {
      positions.set(ids[i], {
        x: startX + i * config.nodeSpacing,
        y,
      });
    }
  }

  const width = maxLayerWidth + config.margin * 2;
  const layerCount = Math.max(1, layers.size);
  let height;
  if (layers.size === 0) {
    height = config.nodeHeight + config.margin * 2;
  } else {
    height = currentY - layerGap + config.margin; // subtract last gap and add margin
  }`;

const newFunc = `  for (const [depth, ids] of layers) {
    const layerWidth =
      config.nodeWidth + Math.max(0, ids.length - 1) * config.nodeSpacing;
    const startX = config.margin + (maxLayerWidth - layerWidth) / 2;
    const y = layerY.get(depth)!;

    for (let i = 0; i < ids.length; i++) {
      positions.set(ids[i], {
        x: startX + i * config.nodeSpacing,
        y,
      });
    }
  }

  // Bottom-up computation of bounding boxes for expanded parents
  if (isExpandedParent.size > 0) {
    // Topologically sort parent hierarchy (bottom-up)
    // We can do this by collecting all parents, finding their depth in the parent tree, and sorting descending.
    const parentDepths = new Map<string, number>();
    for (const id of isExpandedParent) {
      let d = 0;
      let curr = graph.nodes.get(id)?.parent;
      while (curr) {
        d++;
        curr = graph.nodes.get(curr)?.parent;
      }
      parentDepths.set(id, d);
    }

    const sortedParents = Array.from(isExpandedParent).sort((a, b) => parentDepths.get(b)! - parentDepths.get(a)!);

    const paddingX = 20;
    const paddingTop = 40;
    const paddingBottom = 20;

    for (const parentId of sortedParents) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let hasChildren = false;

      // Find all immediate children of this parent
      for (const [childId, childNode] of graph.nodes) {
        if (childNode.parent === parentId && positions.has(childId)) {
          hasChildren = true;
          const pos = positions.get(childId)!;
          const size = nodeSizes.get(childId) || { width: config.nodeWidth, height: config.nodeHeight };

          if (pos.x < minX) minX = pos.x;
          if (pos.y < minY) minY = pos.y;
          if (pos.x + size.width > maxX) maxX = pos.x + size.width;
          if (pos.y + size.height > maxY) maxY = pos.y + size.height;
        }
      }

      if (hasChildren) {
        // Compute bounding box incorporating padding
        positions.set(parentId, {
          x: minX - paddingX,
          y: minY - paddingTop,
        });
        nodeSizes.set(parentId, {
          width: (maxX - minX) + paddingX * 2,
          height: (maxY - minY) + paddingTop + paddingBottom,
        });
      } else {
        // Fallback for expanded parent with no children
        positions.set(parentId, { x: 0, y: 0 });
        nodeSizes.set(parentId, { width: config.nodeWidth, height: config.nodeHeight });
      }
    }
  }

  // Adjust total graph width/height to account for new parent bounding boxes
  let totalMinX = Infinity;
  let totalMinY = Infinity;
  let totalMaxX = -Infinity;
  let totalMaxY = -Infinity;

  if (positions.size === 0) {
    totalMinX = 0;
    totalMinY = 0;
    totalMaxX = config.nodeWidth;
    totalMaxY = config.nodeHeight;
  } else {
    for (const [id, pos] of positions) {
      const size = nodeSizes.get(id) || { width: config.nodeWidth, height: config.nodeHeight };
      if (pos.x < totalMinX) totalMinX = pos.x;
      if (pos.y < totalMinY) totalMinY = pos.y;
      if (pos.x + size.width > totalMaxX) totalMaxX = pos.x + size.width;
      if (pos.y + size.height > totalMaxY) totalMaxY = pos.y + size.height;
    }
  }

  // Ensure positive origins and scale up dimensions accordingly
  const offsetX = totalMinX < config.margin ? config.margin - totalMinX : 0;
  const offsetY = totalMinY < config.margin ? config.margin - totalMinY : 0;

  if (offsetX > 0 || offsetY > 0) {
    for (const id of positions.keys()) {
      const p = positions.get(id)!;
      positions.set(id, { x: p.x + offsetX, y: p.y + offsetY });
    }
    totalMaxX += offsetX;
    totalMaxY += offsetY;
  }

  const width = totalMaxX + config.margin;
  const height = totalMaxY + config.margin;`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/layout.ts', code);

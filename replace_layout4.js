import fs from 'fs';

const file = 'src/layout.ts';
let code = fs.readFileSync(file, 'utf8');

const computeLayerPositions = `
function computeLayerPositions(layers: ReadonlyMap<number, readonly string[]>, nodeIds: readonly string[], config: Required<VerticalLayoutOptions>) {
  const positions = new Map<string, Point>();
  const nodeSizes = new Map<string, Size>();

  for (const id of nodeIds) {
    const isCollapsed = config.collapsedNodes?.has(id) ?? false;
    nodeSizes.set(id, {
      width: config.nodeWidth,
      height: isCollapsed ? 36 : config.nodeHeight,
    });
  }

  let maxLayerSize = 1;
  for (const ids of layers.values()) {
    if (ids.length > maxLayerSize) {
      maxLayerSize = ids.length;
    }
  }

  const maxLayerWidth = config.nodeWidth + Math.max(0, maxLayerSize - 1) * config.nodeSpacing;

  const layerY = new Map<number, number>();
  let currentY = config.margin;

  const sortedDepths = new Array<number>(layers.size);
  let dIdx = 0;
  for (const depth of layers.keys()) {
    sortedDepths[dIdx++] = depth;
  }
  sortedDepths.sort((a, b) => a - b);

  const layerGap = config.layerSpacing - config.nodeHeight;

  for (const depth of sortedDepths) {
    layerY.set(depth, currentY);

    let maxLayerNodeHeight = 0;
    const ids = layers.get(depth)!;
    for (const id of ids) {
      const h = nodeSizes.get(id)!.height;
      if (h > maxLayerNodeHeight) {
        maxLayerNodeHeight = h;
      }
    }

    currentY += maxLayerNodeHeight + layerGap;
  }

  for (const [depth, ids] of layers) {
    const layerWidth = config.nodeWidth + Math.max(0, ids.length - 1) * config.nodeSpacing;
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
    height = currentY - layerGap + config.margin;
  }

  return { positions, nodeSizes, width, height };
}
`;

code += computeLayerPositions;

const oldPositions = `  const positions = new Map<string, Point>();

  // Replace spread Math.max with iterative calculation to prevent Maximum Call Stack Size Exceeded
  // on very large graphs, and to avoid creating a large intermediate array.
  const nodeSizes = new Map<string, Size>();
  for (const id of nodeIds) {
    const isCollapsed = config.collapsedNodes?.has(id) ?? false;
    nodeSizes.set(id, {
      width: config.nodeWidth,
      height: isCollapsed ? 36 : config.nodeHeight,
    });
  }

  let maxLayerSize = 1;
  for (const ids of layers.values()) {
    if (ids.length > maxLayerSize) {
      maxLayerSize = ids.length;
    }
  }

  const maxLayerWidth =
    config.nodeWidth + Math.max(0, maxLayerSize - 1) * config.nodeSpacing;

  // Calculate dynamic layer heights and Y positions
  const layerY = new Map<number, number>();
  let currentY = config.margin;

  // Create an array of depths to process them in order
  const sortedDepths = new Array<number>(layers.size);
  let dIdx = 0;
  for (const depth of layers.keys()) {
    sortedDepths[dIdx++] = depth;
  }
  sortedDepths.sort((a, b) => a - b);

  const layerGap = config.layerSpacing - config.nodeHeight;

  for (const depth of sortedDepths) {
    layerY.set(depth, currentY);

    // Find max height in this layer
    let maxLayerNodeHeight = 0;
    const ids = layers.get(depth)!;
    for (const id of ids) {
      const h = nodeSizes.get(id)!.height;
      if (h > maxLayerNodeHeight) {
        maxLayerNodeHeight = h;
      }
    }

    currentY += maxLayerNodeHeight + layerGap;
  }

  for (const [depth, ids] of layers) {
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

const newPositions = `  const { positions, nodeSizes, width, height } = computeLayerPositions(layers, nodeIds, config);`;

code = code.replace(oldPositions, newPositions);
fs.writeFileSync(file, code);

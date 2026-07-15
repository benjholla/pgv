/**
 * @module
 * @packageDocumentation
 * Frontend-owned vertical layout and geometric routing calculations.
 */

import type { GraphSnapshot, GraphEdge } from "./model";

/**
 * Represents an absolute 2D coordinate point in the rendering coordinate system.
 *
 * Used for positioning nodes, routing edge paths, and determining layout geometry.
 */
export interface Point {
  /**
   * The X coordinate.
   */
  readonly x: number;
  /**
   * The Y coordinate.
   */
  readonly y: number;
}

/**
 * Represents the absolute 2D dimensions of a bounding box.
 *
 * Typically used to explicitly specify variable node dimensions for the layout engine.
 */
export interface Size {
  /**
   * The width of the bounding box.
   */
  readonly width: number;
  /**
   * The height of the bounding box.
   */
  readonly height: number;
}

/**
 * Routing hints used during A* orthogonal edge routing to stagger overlapping paths.
 *
 * It helps distribute horizontal segments evenly, preventing visually merged lines
 * by supplying the computed horizontal offsets necessary for source and target endpoints.
 */
export interface EdgeRoutingHint {
  /**
   * The horizontal offset from the center of the source node (in pixels).
   */
  readonly sourceOffsetPx: number;

  /**
   * The horizontal offset from the center of the target node (in pixels).
   */
  readonly targetOffsetPx: number;

  /**
   * The relative ordering index of this edge among all edges leaving the same source node.
   */
  readonly outIndex: number;

  /**
   * The relative ordering index of this edge among all edges entering the same target node.
   */
  readonly inIndex: number;

  /**
   * The total number of edges leaving the same source node.
   */
  readonly outTotal: number;

  /**
   * The total number of edges entering the same target node.
   */
  readonly inTotal: number;
}

/**
 * An immutable snapshot of a computed graph layout.
 *
 * This provides the exact visual geometry for a graph (node positions, sizes, and edge routing hints)
 * completely disconnected from the logical graph model itself.
 *
 * **Why it exists**:
 * This explicit separation of layout geometry from the `GraphSnapshot` model ensures that operations
 * like logical diffing or subgraph projection do not accidentally invalidate rendering state.
 * It also enables trivial implementation of layout transitions, animations, and alternative views
 * (like minimaps) by sharing or interpolating layout coordinate snapshots.
 */
export interface LayoutSnapshot {
  /**
   * A map of node IDs to their absolute visual coordinates.
   */
  readonly positions: ReadonlyMap<string, Point>;

  /**
   * The total width of the graph layout.
   */
  readonly width: number;

  /**
   * The total height of the graph layout.
   */
  readonly height: number;

  /**
   * The dimensions allocated to each node in the layout.
   */
  readonly nodeSize: Size;

  /**
   * Custom sizes for nodes (e.g. collapsed nodes). Fallback to nodeSize if not present.
   */
  readonly nodeSizes?: ReadonlyMap<string, Size>;

  /**
   * Routing hints for staggering edge paths.
   */
  readonly edgeRouting?: ReadonlyMap<string, EdgeRoutingHint>;
}

/**
 * Configuration options for the built-in vertical hierarchical layout algorithm.
 *
 * Provides control over grid spacing, default node dimensions, and container margins.
 * This is particularly useful when nodes use custom HTML rendering that requires more
 * space than the default settings provide, or when aiming for a specific visual density.
 */
export interface VerticalLayoutOptions {
  /**
   * The width allocated for each node.
   */
  readonly nodeWidth?: number;

  /**
   * The height allocated for each node.
   */
  readonly nodeHeight?: number;

  /**
   * The vertical spacing between depth layers.
   */
  readonly layerSpacing?: number;

  /**
   * The horizontal spacing between adjacent nodes in the same layer.
   */
  readonly nodeSpacing?: number;

  /**
   * The minimum margin around the outer boundary of the layout.
   */
  readonly margin?: number;

  /**
   * A set of node IDs that are currently collapsed.
   */
  readonly collapsedNodes?: ReadonlySet<string>;
}

const DEFAULT_VERTICAL_LAYOUT: Required<VerticalLayoutOptions> = {
  nodeWidth: 220,
  nodeHeight: 88,
  layerSpacing: 148,
  nodeSpacing: 280,
  margin: 32,
  collapsedNodes: new Set(),
};

/**
 * Computes a basic hierarchical vertical layout for a given graph.
 *
 * This layout orchestrates the primary rendering pipeline design by decoupling topological sorting from geometric routing. It first organizes nodes into hierarchical depth layers using an iterative Kahn's algorithm (with a DFS cycle-breaking pass). Once layered, nodes are distributed horizontally.
 *
 * If a `previousLayout` is provided, the algorithm will attempt to preserve the relative topological order and visual locality of nodes within layers, minimizing context shifts and jumping during re-renders.
 * Later in the rendering pipeline, edges are individually routed between these laid-out nodes using an A* shortest-path algorithm (via `edgeEndpoints`) to compute orthogonal lines that avoid intersecting node bounding boxes.
 *
 * @param graph The logical graph to lay out.
 * @param options Dimensions and spacing parameters.
 * @param previousLayout An optional previous layout to use as an ordering hint for nodes.
 * @returns A computed `LayoutSnapshot` containing absolute coordinates for all nodes.
 */
export function verticalLayout(
  graph: GraphSnapshot,
  options: VerticalLayoutOptions = {},
  previousLayout?: LayoutSnapshot,
): LayoutSnapshot {
  const config = { ...DEFAULT_VERTICAL_LAYOUT, ...options };
  // Sort node IDs to guarantee determinism in layout regardless of input map iteration order
  const nodeIds = new Array<string>(graph.nodes.size);
  let nIdx = 0;
  for (const id of graph.nodes.keys()) {
    nodeIds[nIdx++] = id;
  }
  nodeIds.sort();
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const edgeOutgoing = new Map<string, string[]>();
  const edgeIncoming = new Map<string, string[]>();

  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
    edgeOutgoing.set(id, []);
    edgeIncoming.set(id, []);
  }

  for (const edge of graph.edges.values()) {
    // Note: We always need to add to edgeOutgoing and edgeIncoming even if nodes are missing
    // or if it's a self loop, to maintain behavior of staggering calculation later.
    if (!edgeOutgoing.has(edge.source)) edgeOutgoing.set(edge.source, []);
    if (!edgeIncoming.has(edge.target)) edgeIncoming.set(edge.target, []);
    edgeOutgoing.get(edge.source)!.push(edge.id);
    edgeIncoming.get(edge.target)!.push(edge.id);

    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  }

  // Sort outgoing edges to guarantee deterministic traversal
  for (const neighbors of outgoing.values()) {
    neighbors.sort();
  }
  for (const list of edgeOutgoing.values()) {
    list.sort();
  }
  for (const list of edgeIncoming.values()) {
    list.sort();
  }

  const depths = assignVerticalDepths(nodeIds, outgoing, incoming);
  const layers = groupByDepth(nodeIds, depths);

  if (previousLayout) {
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

  const positions = new Map<string, Point>();

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
  }


  const edgeRouting = new Map<string, EdgeRoutingHint>();
  const spacing = 16;
  const maxOffset = config.nodeWidth / 2 - 8;

  for (const edge of graph.edges.values()) {
    const outList = edgeOutgoing.get(edge.source) || [];
    const outIndex = outList.indexOf(edge.id);
    const outTotal = outList.length;
    let sOffset = 0;
    if (outTotal > 1) {
      sOffset = (outIndex - (outTotal - 1) / 2) * spacing;
      sOffset = Math.max(-maxOffset, Math.min(maxOffset, sOffset));
    }

    const inList = edgeIncoming.get(edge.target) || [];
    const inIndex = inList.indexOf(edge.id);
    const inTotal = inList.length;
    let tOffset = 0;
    if (inTotal > 1) {
      tOffset = (inIndex - (inTotal - 1) / 2) * spacing;
      tOffset = Math.max(-maxOffset, Math.min(maxOffset, tOffset));
    }

    edgeRouting.set(edge.id, Object.freeze({
      sourceOffsetPx: sOffset,
      targetOffsetPx: tOffset,
      outIndex,
      inIndex,
      outTotal,
      inTotal
    }));
  }

  return Object.freeze({
    positions,
    width,
    height,
    nodeSize: Object.freeze({
      width: config.nodeWidth,
      height: config.nodeHeight,
    }),
    nodeSizes: Object.freeze(nodeSizes),
    edgeRouting,
  });
}

/**
 * Result of calculating the geometric endpoints and orthogonal routing path for a rendered edge.
 *
 * This structure holds the precise start, end, and intermediate joint points necessary
 * to draw an orthogonal line between two nodes, factoring in node bounds and staggering offsets.
 */
export interface EdgeEndpointsResult {
  /**
   * The start point of the edge.
   */
  readonly source: Point;
  /**
   * The end point of the edge.
   */
  readonly target: Point;
  /**
   * The routed path for the edge.
   */
  readonly path: readonly Point[];
}

/**
 * Calculates the exact `(x, y)` connection points for a given edge based on the
 * layout of its source and target nodes.
 *
 * It uses the `nodeSize` from the layout snapshot to snap the endpoints to the
 * bottom-center of the source node and top-center of the target node, ensuring
 * edges do not draw over the node bodies in a vertical layout.
 *
 * @param edge The edge to calculate endpoints for.
 * @param layout The layout containing the positions of the connected nodes.
 * @returns The geometric endpoints for the edge, or `null` if the connected nodes are missing from the layout.
 */
export function edgeEndpoints(
  edge: GraphEdge,
  layout: LayoutSnapshot,
): EdgeEndpointsResult | null {
  const source = layout.positions.get(edge.source);
  const target = layout.positions.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const routing = layout.edgeRouting?.get(edge.id) || {
    sourceOffsetPx: 0, targetOffsetPx: 0, outIndex: 0, inIndex: 0, outTotal: 1, inTotal: 1
  };

  const sourceSize = layout.nodeSizes?.get(edge.source) || layout.nodeSize;
  const targetSize = layout.nodeSizes?.get(edge.target) || layout.nodeSize;

  const sourcePt = {
    x: source.x + sourceSize.width / 2 + routing.sourceOffsetPx,
    y: source.y + sourceSize.height,
  };

  const targetPt = {
    x: target.x + targetSize.width / 2 + routing.targetOffsetPx,
    y: target.y,
  };

  const path = routeEdgeOrthogonal(sourcePt, targetPt, layout, routing.outIndex, routing.inIndex, routing.outTotal, routing.inTotal);

  return {
    source: sourcePt,
    target: targetPt,
    path,
  };
}

/**
 * Routes an edge orthogonally between two points while avoiding node obstacles.
 *
 * This function uses an A* pathfinding algorithm over a dynamically generated
 * orthogonal grid. The grid is constructed from the coordinates of the nodes,
 * start and end points, and routing margins. It uses `g` (distance + penalty)
 * and `f` (heuristic) scores, tracking open and closed sets to find the shortest
 * valid path. Directional penalties are applied to minimize unnecessary joints
 * and produce clean, predictable edge routing.
 *
 * @param sourcePt The starting point of the edge.
 * @param targetPt The ending point of the edge.
 * @param layout The current layout containing node sizes and positions (obstacles).
 * @returns A readonly array of points defining the calculated orthogonal path.
 */
function routeEdgeOrthogonal(
  sourcePt: Point,
  targetPt: Point,
  layout: LayoutSnapshot,
  outIndex: number = 0,
  inIndex: number = 0,
  outTotal: number = 1,
  inTotal: number = 1,
): readonly Point[] {
  const margin = 20;

  const obstacles: { x: number; y: number; w: number; h: number }[] = [];
  for (const [id, pos] of layout.positions.entries()) {
    const size = layout.nodeSizes?.get(id) || layout.nodeSize;
    obstacles.push({
      x: pos.x,
      y: pos.y,
      w: size.width,
      h: size.height,
    });
  }

  const xSet = new Set<number>();
  const ySet = new Set<number>();

  xSet.add(sourcePt.x);
  ySet.add(sourcePt.y);
  xSet.add(targetPt.x);
  ySet.add(targetPt.y);

  const spacing = 15;
  const minOffset = 20;

  const physicalSpace = targetPt.y - sourcePt.y;
  let maxOffset = Infinity;
  if (physicalSpace > 0) {
    maxOffset = Math.max(minOffset, (physicalSpace / 2) - 4);
  }

  const maxRequiredSource = minOffset + (outTotal - 1) * spacing;
  let sourceVerticalOffset = minOffset + outIndex * spacing;
  if (maxRequiredSource > maxOffset && outTotal > 1) {
    const availableStagger = Math.max(0, maxOffset - minOffset);
    sourceVerticalOffset = minOffset + outIndex * (availableStagger / (outTotal - 1));
  } else {
    sourceVerticalOffset = Math.min(sourceVerticalOffset, maxOffset);
  }

  const maxRequiredTarget = minOffset + (inTotal - 1) * spacing;
  let targetVerticalOffset = minOffset + inIndex * spacing;
  if (maxRequiredTarget > maxOffset && inTotal > 1) {
    const availableStagger = Math.max(0, maxOffset - minOffset);
    targetVerticalOffset = minOffset + inIndex * (availableStagger / (inTotal - 1));
  } else {
    targetVerticalOffset = Math.min(targetVerticalOffset, maxOffset);
  }

  ySet.add(sourcePt.y + sourceVerticalOffset);
  ySet.add(targetPt.y - targetVerticalOffset);

  for (const pos of layout.positions.values()) {
    xSet.add(pos.x - margin);
    xSet.add(pos.x + layout.nodeSize.width + margin);
    ySet.add(pos.y - margin);
    ySet.add(pos.y + layout.nodeSize.height + margin);

    xSet.add(pos.x + layout.nodeSize.width / 2);
  }

  xSet.add(-margin);
  xSet.add(layout.width + margin);
  ySet.add(-margin);
  ySet.add(layout.height + margin);

  const xCoords = new Array<number>(xSet.size);
  let xIdx = 0;
  for (const val of xSet) {
    xCoords[xIdx++] = val;
  }
  xCoords.sort((a, b) => a - b);

  const yCoords = new Array<number>(ySet.size);
  let yIdx = 0;
  for (const val of ySet) {
    yCoords[yIdx++] = val;
  }
  yCoords.sort((a, b) => a - b);

  type Node = { xIdx: number; yIdx: number; g: number; f: number; parent: Node | null; dirX: number; dirY: number };

  const getIdx = (arr: number[], val: number) => {
    let minIdx = 0;
    let minD = Math.abs(arr[0] - val);
    for (let i = 1; i < arr.length; i++) {
        const d = Math.abs(arr[i] - val);
        if (d < minD) {
            minD = d;
            minIdx = i;
        }
    }
    return minIdx;
  };

  const startXIdx = getIdx(xCoords, sourcePt.x);
  const startYIdx = getIdx(yCoords, sourcePt.y);
  const endXIdx = getIdx(xCoords, targetPt.x);
  const endYIdx = getIdx(yCoords, targetPt.y);

  const isSegmentValid = (x1: number, y1: number, x2: number, y2: number) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (
        minX < obs.x + obs.w &&
        maxX > obs.x &&
        minY < obs.y + obs.h &&
        maxY > obs.y
      ) {
        return false;
      }
    }
    return true;
  };

  const openList: Node[] = [];
  const closedSet = new Set<string>();

  openList.push({ xIdx: startXIdx, yIdx: startYIdx, g: 0, f: 0, parent: null, dirX: 0, dirY: 1 });

  const allowedY1 = sourcePt.y + sourceVerticalOffset;
  const allowedY2 = targetPt.y - targetVerticalOffset;

  while (openList.length > 0) {
    // PERF(Bolt): O(N) linear scan + swap-pop is faster than O(N log N) sorting
    let minIdx = 0;
    let minF = openList[0].f;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < minF) {
        minF = openList[i].f;
        minIdx = i;
      }
    }
    const lastIdx = openList.length - 1;
    const curr = openList[minIdx];
    openList[minIdx] = openList[lastIdx];
    openList.pop();

    if (curr.xIdx === endXIdx && curr.yIdx === endYIdx) {
      const path: Point[] = [];
      let c: Node | null = curr;
      while (c) {
        path.push({ x: xCoords[c.xIdx], y: yCoords[c.yIdx] });
        c = c.parent;
      }
      return Object.freeze(path.reverse());
    }

    const key = `${curr.xIdx},${curr.yIdx},${curr.dirX},${curr.dirY}`;
    if (closedSet.has(key)) continue;
    closedSet.add(key);

    for (let i = 0; i < 4; i++) {
      let dx = 0;
      let dy = 0;
      if (i === 0) {
        dy = -1;
      } else if (i === 1) {
        dy = 1;
      } else if (i === 2) {
        dx = -1;
      } else {
        dx = 1;
      }
      const nxIdx = curr.xIdx + dx;
      const nyIdx = curr.yIdx + dy;

      if (nxIdx >= 0 && nxIdx < xCoords.length && nyIdx >= 0 && nyIdx < yCoords.length) {
        if (curr.parent === null && (dx !== 0 || dy !== 1)) {
            continue;
        }

        if (nxIdx === endXIdx && nyIdx === endYIdx) {
             if (curr.xIdx === nxIdx && curr.yIdx === nyIdx - 1) {
                // OK
             } else {
                 if (dx !== 0 || dy !== 1) continue;
             }
        }

        const x1 = xCoords[curr.xIdx];
        const y1 = yCoords[curr.yIdx];
        const x2 = xCoords[nxIdx];
        const y2 = yCoords[nyIdx];

        if (!isSegmentValid(x1, y1, x2, y2)) continue;

        const dist = Math.abs(x2 - x1) + Math.abs(y2 - y1);
        let penalty = 0;
        if (curr.parent !== null && (curr.dirX !== dx || curr.dirY !== dy)) {
          penalty = 50;
        }

        if (dx !== 0) {
          if (y1 !== allowedY1 && y1 !== allowedY2) {
            penalty += 5000;
          } else {
            if (outIndex > inIndex && y1 === allowedY2) penalty += 10;
            else if (inIndex > outIndex && y1 === allowedY1) penalty += 10;
            else if (outIndex === inIndex && y1 === allowedY2) penalty += 10;
          }
        }

        const g = curr.g + dist + penalty;
        const h = Math.abs(xCoords[endXIdx] - x2) + Math.abs(yCoords[endYIdx] - y2);
        const f = g + h;

        openList.push({ xIdx: nxIdx, yIdx: nyIdx, g, f, parent: curr, dirX: dx, dirY: dy });
      }
    }
  }

  return Object.freeze([
    sourcePt,
    { x: sourcePt.x, y: allowedY1 },
    { x: targetPt.x, y: allowedY2 },
    targetPt
  ]);
}
/**
 * Assigns vertical depth levels to nodes using a topological sort approach.
 *
 * This function employs an iterative Kahn's algorithm combined with an initial
 * DFS (Depth-First Search) cycle-breaking pass. The DFS pass ensures the graph
 * is treated as a Directed Acyclic Graph (DAG) by ignoring back-edges.
 * Kahn's algorithm then processes the nodes to assign depths based on the
 * longest path from a root, positioning them appropriately in the vertical hierarchy.
 *
 * @param nodeIds A list of all node IDs in the graph.
 * @param outgoing A map of outgoing edges for each node.
 * @param incomingCounts A map of the number of incoming edges for each node.
 * @returns A map associating each node ID with its calculated depth level.
 */
function assignVerticalDepths(
  nodeIds: readonly string[],
  outgoing: ReadonlyMap<string, readonly string[]>,
  incoming: ReadonlyMap<string, readonly string[]>,
): ReadonlyMap<string, number> {
  const acyclicOutgoing = new Map<string, string[]>();
  for (const id of nodeIds) acyclicOutgoing.set(id, []);

  const state = new Map<string, "visiting" | "visited">();

  function dfsBreakCyclesIterative(startNode: string) {
    const stack: { u: string; edges: readonly string[]; index: number }[] = [];
    stack.push({ u: startNode, edges: outgoing.get(startNode)!, index: 0 });
    state.set(startNode, "visiting");

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const { u, edges, index } = top;

      if (index < edges.length) {
        top.index++;
        const v = edges[index];
        const vState = state.get(v);

        if (vState === "visiting") {
          continue; // Break cycle
        }

        acyclicOutgoing.get(u)!.push(v);

        if (vState !== "visited") {
          state.set(v, "visiting");
          stack.push({ u: v, edges: outgoing.get(v)!, index: 0 });
        }
      } else {
        state.set(u, "visited");
        stack.pop();
      }
    }
  }

  const roots = nodeIds.filter((id) => incoming.get(id)!.length === 0);
  for (const id of roots) {
    if (state.get(id) !== "visited") {
      dfsBreakCyclesIterative(id);
    }
  }
  for (const id of nodeIds) {
    if (state.get(id) !== "visited") {
      dfsBreakCyclesIterative(id);
    }
  }

  const dagIncoming = new Map<string, number>();
  for (const id of nodeIds) dagIncoming.set(id, 0);
  for (const neighbors of acyclicOutgoing.values()) {
    for (const v of neighbors) {
      dagIncoming.set(v, dagIncoming.get(v)! + 1);
    }
  }

  const depths = new Map<string, number>();
  const queue: string[] = [];

  const trueRoots: string[] = [];
  const fakeRoots: string[] = [];

  for (const id of nodeIds) {
    if (dagIncoming.get(id) === 0) {
      if (incoming.get(id)!.length === 0) {
        trueRoots.push(id);
      } else {
        fakeRoots.push(id);
      }
    }
  }

  for (const id of trueRoots) {
    depths.set(id, 0);
    queue.push(id);
  }

  let currentMaxDepth = -1;
  let qIdx = 0;

  const processQueue = () => {
    while (qIdx < queue.length) {
      const u = queue[qIdx++];
      const d = depths.get(u)!;
      if (d > currentMaxDepth) currentMaxDepth = d;

      for (const v of acyclicOutgoing.get(u)!) {
        const newD = d + 1;
        const currentVD = depths.get(v);
        if (currentVD === undefined || newD > currentVD) {
          depths.set(v, newD);
        }

        const inDeg = dagIncoming.get(v)! - 1;
        dagIncoming.set(v, inDeg);
        if (inDeg === 0) {
          queue.push(v);
        }
      }
    }
  };

  processQueue();

  let nextDepth = currentMaxDepth + 1;
  for (const id of fakeRoots) {
    if (!depths.has(id)) {
      depths.set(id, nextDepth);
      queue.push(id);
    }
  }

  processQueue();

  return depths;
}

function groupByDepth(
  nodeIds: readonly string[],
  depths: ReadonlyMap<string, number>,
): ReadonlyMap<number, readonly string[]> {
  const layers = new Map<number, string[]>();

  for (const id of nodeIds) {
    const depth = depths.get(id)!;
    const layer = layers.get(depth) ?? [];

    layer.push(id);
    layers.set(depth, layer);
  }

  const entries = new Array<[number, readonly string[]]>(layers.size);
  let eIdx = 0;
  for (const entry of layers.entries()) {
    entries[eIdx++] = entry;
  }
  entries.sort(([a], [b]) => a - b);

  return new Map(entries);
}

/**
 * @module
 * @packageDocumentation
 * Frontend-owned vertical layout and geometric routing calculations.
 */

function isContainmentEdge(edge: GraphEdge, tags: ReadonlySet<string>): boolean {
  if (edge.tags.length === 0) return false;
  for (let i = 0; i < edge.tags.length; i++) {
    if (tags.has(edge.tags[i])) {
      return true;
    }
  }
  return false;
}

function binarySearch(arr: readonly string[], target: string): number {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

/**
 * PERF(Bolt): Replaced O(N) scan with O(log N) binary search since coordinate arrays are sorted
 */
function findClosestCoordinateIndex(arr: readonly number[], val: number): number {
  let low = 0;
  let high = arr.length - 1;

  if (val <= arr[0]) return 0;
  if (val >= arr[high]) return high;

  while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = arr[mid];

      if (midVal === val) return mid;

      if (midVal < val) {
          low = mid + 1;
      } else {
          high = mid - 1;
      }
  }

  const dHigh = val - arr[high];
  const dLow = arr[low] - val;

  return dHigh <= dLow ? high : low;
}

import type { GraphSnapshot, GraphEdge , GraphSchema} from "./model";

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
   * The hierarchical containment structure representing parent-child relationships.
   */
  readonly hierarchy?: ReadonlyMap<string, {
    /** The parent node ID, or null if it's a root node. */
    parent: string | null;
    /** The list of child node IDs. */
    children: string[]
  }>;
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
  /**
   * Tags that identify containment edges, which should be ignored during layout.
   */
  readonly containmentTags?: ReadonlySet<string>;
}

const DEFAULT_VERTICAL_LAYOUT: Required<VerticalLayoutOptions> = {
  nodeWidth: 220,
  nodeHeight: 88,
  layerSpacing: 148,
  nodeSpacing: 280,
  margin: 32,
  containmentTags: new Set(),
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
 * @example
 * ```typescript
 * const layout = verticalLayout(snapshot, {
 *   nodeWidth: 150,
 *   nodeHeight: 50,
 *   layerSpacing: 100
 * });
 * const nodePos = layout.positions.get("A");
 * console.log(`Node A is at (${nodePos?.x}, ${nodePos?.y})`);
 * ```
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
  schema?: GraphSchema
): LayoutSnapshot {
  const config = { ...DEFAULT_VERTICAL_LAYOUT, ...options };
  const { nodeIds, parentNodes } = identifyCompoundNodes(graph, config);
  const { outgoing, incoming, edgeOutgoing, edgeIncoming } = buildAdjacencyLists(graph, nodeIds, parentNodes, config);

  const depths = assignVerticalDepths(nodeIds, outgoing, incoming);
  const layers = groupByDepth(nodeIds, depths);

  if (previousLayout && previousLayout.positions) {
    applyPreviousLayoutHints(layers, previousLayout, incoming, outgoing);
  }

  const { positions, nodeSizes, width, height } = computeLayerPositions(graph, layers, nodeIds, config);


  const edgeRouting = computeEdgeRoutingHints(graph, edgeOutgoing, edgeIncoming, config);

  const hierarchy = computeCompoundNodeBounds(graph, schema, positions, nodeSizes, config);

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
    hierarchy,
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

  const path = routeEdgeOrthogonal(sourcePt, targetPt, layout, routing.outIndex, routing.inIndex, routing.outTotal, routing.inTotal, edge.source, edge.target);

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
export function routeEdgeOrthogonal(
  sourcePt: Point,
  targetPt: Point,
  layout: LayoutSnapshot,
  outIndex: number = 0,
  inIndex: number = 0,
  outTotal: number = 1,
  inTotal: number = 1,
  sourceId?: string,
  targetId?: string,
): readonly Point[] {
  const margin = 20;

  const obstacles: { id: string; x: number; y: number; w: number; h: number }[] = [];
  for (const [id, pos] of layout.positions.entries()) {
    const size = layout.nodeSizes?.get(id) || layout.nodeSize;
    obstacles.push({
      id,
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

  type Node = { xIdx: number; yIdx: number; g: number; f: number; parent: Node | null; dirX: number; dirY: number; dir: number };


  const startXIdx = findClosestCoordinateIndex(xCoords, sourcePt.x);
  const startYIdx = findClosestCoordinateIndex(yCoords, sourcePt.y);
  const endXIdx = findClosestCoordinateIndex(xCoords, targetPt.x);
  const endYIdx = findClosestCoordinateIndex(yCoords, targetPt.y);

  const isSegmentValid = (x1: number, y1: number, x2: number, y2: number) => {
    // Add small epsilon to allow edges to route exactly on the boundary of nodes (or ports)
    let minX = Math.min(x1, x2) + 0.1;
    let maxX = Math.max(x1, x2) - 0.1;
    let minY = Math.min(y1, y2) + 0.1;
    let maxY = Math.max(y1, y2) - 0.1;
    if (minX > maxX) { minX = x1 - 0.1; maxX = x1 + 0.1; }
    if (minY > maxY) { minY = y1 - 0.1; maxY = y1 + 0.1; }

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];

      // If this obstacle is a compound node container, it shouldn't block edge routing
      // traversing through it to connect to its inner children.
      if (layout.hierarchy?.has(obs.id) && layout.hierarchy.get(obs.id)!.children.length > 0) {
        continue;
      }

      // The +/- 0.1 epsilon applied to the segment bounds above ensures that edges
      // routing exactly along the boundary of an obstacle (like the source or target node)
      // do not intersect it. However, any segment that genuinely crosses through the interior
      // of an obstacle will be detected and blocked.
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
  const closedSet = new Uint8Array(xCoords.length * yCoords.length * 4);

  openList.push({ xIdx: startXIdx, yIdx: startYIdx, g: 0, f: 0, parent: null, dirX: 0, dirY: 1, dir: 1 });

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

    const key = (curr.xIdx * yCoords.length + curr.yIdx) * 4 + curr.dir;
    if (closedSet[key] === 1) continue;
    closedSet[key] = 1;

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

        openList.push({ xIdx: nxIdx, yIdx: nyIdx, g, f, parent: curr, dirX: dx, dirY: dy, dir: i });
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

function identifyCompoundNodes(graph: GraphSnapshot, config: Required<VerticalLayoutOptions>) {
  const parentNodes = new Set<string>();
  for (const edge of graph.edges.values()) {
    if (isContainmentEdge(edge, config.containmentTags)) {
      parentNodes.add(edge.source);
    }
  }

  const nodeIds = [];
  for (const id of graph.nodes.keys()) {
    if (!parentNodes.has(id)) {
      nodeIds.push(id);
    }
  }
  nodeIds.sort();

  return { nodeIds, parentNodes };
}

function buildAdjacencyLists(graph: GraphSnapshot, nodeIds: readonly string[], parentNodes: ReadonlySet<string>, config: Required<VerticalLayoutOptions>) {
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
    if (isContainmentEdge(edge, config.containmentTags)) {
      continue;
    }

    // Note: We always need to add to edgeOutgoing and edgeIncoming even if nodes are missing
    // or if it's a self loop, to maintain behavior of staggering calculation later.
    if (!edgeOutgoing.has(edge.source)) edgeOutgoing.set(edge.source, []);
    if (!edgeIncoming.has(edge.target)) edgeIncoming.set(edge.target, []);
    edgeOutgoing.get(edge.source)!.push(edge.id);
    edgeIncoming.get(edge.target)!.push(edge.id);

    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target) || parentNodes.has(edge.source) || parentNodes.has(edge.target)) {
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

  return { outgoing, incoming, edgeOutgoing, edgeIncoming };
}

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


function estimateNodeHeight(graph: GraphSnapshot, id: string, config: Required<VerticalLayoutOptions>) {
  const isCollapsed = config.collapsedNodes?.has(id) ?? false;
  if (isCollapsed) return 36;

  const node = graph.nodes.get(id);
  if (!node) return config.nodeHeight;

  let attrCount = 0;
  for (const key in node.attributes) {
    if (Object.prototype.hasOwnProperty.call(node.attributes, key)) {
      attrCount++;
    }
  }

  if (attrCount === 0) {
    return config.nodeHeight;
  }

  // Base height (title + id + padding) + margin-top (4) + attributes rows (14px per row + 2px gap)
  return config.nodeHeight + 4 + (attrCount * 14) + ((attrCount - 1) * 2);
}

function computeLayerPositions(graph: GraphSnapshot, layers: ReadonlyMap<number, readonly string[]>, nodeIds: readonly string[], config: Required<VerticalLayoutOptions>) {
  const positions = new Map<string, Point>();
  const nodeSizes = new Map<string, Size>();

  for (const id of nodeIds) {
    nodeSizes.set(id, { width: config.nodeWidth, height: estimateNodeHeight(graph, id, config) });
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

function computeEdgeRoutingHints(
  graph: GraphSnapshot,
  edgeOutgoing: ReadonlyMap<string, readonly string[]>,
  edgeIncoming: ReadonlyMap<string, readonly string[]>,
  config: Required<VerticalLayoutOptions>
) {
  const edgeRouting = new Map<string, EdgeRoutingHint>();
  const spacing = 16;
  const maxOffset = config.nodeWidth / 2 - 8;

  for (const edge of graph.edges.values()) {
    if (isContainmentEdge(edge, config.containmentTags)) {
      continue;
    }

    const outList = edgeOutgoing.get(edge.source) || [];
    const outIndex = binarySearch(outList, edge.id);
    const outTotal = outList.length;
    let sOffset = 0;
    if (outTotal > 1) {
      sOffset = (outIndex - (outTotal - 1) / 2) * spacing;
      sOffset = Math.max(-maxOffset, Math.min(maxOffset, sOffset));
    }

    const inList = edgeIncoming.get(edge.target) || [];
    const inIndex = binarySearch(inList, edge.id);
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

  return edgeRouting;
}

function computeCompoundNodeBounds(
  graph: GraphSnapshot,
  schema: GraphSchema | undefined,
  positions: Map<string, Point>,
  nodeSizes: Map<string, Size>,
  config: Required<VerticalLayoutOptions>
) {
  const layoutHierarchy = new Map<string, { parent: string | null; children: string[] }>();
  for (const id of graph.nodes.keys()) {
    layoutHierarchy.set(id, { children: [], parent: null });
  }

  let hasHierarchy = false;
  if (schema?.containment) {
    hasHierarchy = true;

    // In some tests, schema.containment is provided but config.containmentTags wasn't explicitly populated
    // We should ensure we use a Set for O(1) lookups regardless.
    const containmentSet = config.containmentTags.size > 0
      ? config.containmentTags
      : new Set(schema.containment);

    for (const edge of graph.edges.values()) {
      if (isContainmentEdge(edge, containmentSet)) {
        if (layoutHierarchy.has(edge.source) && layoutHierarchy.has(edge.target)) {
          layoutHierarchy.get(edge.source)!.children.push(edge.target);
          layoutHierarchy.get(edge.target)!.parent = edge.source;
        }
      }
    }

    const calcSize = (id: string): {w: number, h: number} => {
       const children = layoutHierarchy.get(id)?.children || [];
       const isCol = config.collapsedNodes?.has(id) ?? false;
       if (isCol || children.length === 0) {
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
          const s = calcSize(childId);
          const p = positions.get(childId);
          if (p) {
             hasChildren = true;
             if (p.x < minX) minX = p.x;
             if (p.x + s.w > maxX) maxX = p.x + s.w;
             if (p.y < minY) minY = p.y;
             if (p.y + s.h > maxY) maxY = p.y + s.h;
          }
       }
       if (hasChildren) {
          const pad = 40;
          const header = 40;
          const w = (maxX - minX) + pad * 2;
          const h = (maxY - minY) + header + pad * 2;
          nodeSizes.set(id, {width: w, height: h});
          positions.set(id, {x: minX - pad, y: minY - header - pad});

          // Make sure parent node is included in the output even if it wasn't processed by the main graph layout
          if (!positions.has(id)) {
              positions.set(id, {x: minX - pad, y: minY - header - pad});
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

  return hasHierarchy ? layoutHierarchy : undefined;
}

import type { GraphSnapshot, GraphEdge } from "./model";

/**
 * Represents a 2D coordinate point.
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
 * Represents a 2D bounding box dimension.
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
 * Represents the computed visual coordinates and bounding box for a graph.
 *
 * This snapshot separates the spatial arrangement of the graph from its logical
 * structure (`GraphSnapshot`), ensuring that rendering engines can predictably
 * position elements without coupling logic to geometry.
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
}

/**
 * Configuration options for the vertical layout algorithm.
 *
 * Allows tuning of node dimensions and spacing layers to fit varying label sizes
 * or density preferences.
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
}

const DEFAULT_VERTICAL_LAYOUT: Required<VerticalLayoutOptions> = {
  nodeWidth: 220,
  nodeHeight: 88,
  layerSpacing: 148,
  nodeSpacing: 280,
  margin: 32,
};

/**
 * Computes a basic hierarchical vertical layout for a given graph.
 *
 * This layout orchestrates the primary rendering pipeline design by decoupling topological sorting from geometric routing. It first organizes nodes into hierarchical depth layers using an iterative Kahn's algorithm (with a DFS cycle-breaking pass). Once layered, nodes are distributed horizontally. Later in the rendering pipeline, edges are individually routed between these laid-out nodes using an A* shortest-path algorithm (via `edgeEndpoints`) to compute orthogonal lines that avoid intersecting node bounding boxes.
 *
 * @param graph The logical graph to lay out.
 * @param options Dimensions and spacing parameters.
 * @returns A computed `LayoutSnapshot` containing absolute coordinates for all nodes.
 */
export function verticalLayout(
  graph: GraphSnapshot,
  options: VerticalLayoutOptions = {},
): LayoutSnapshot {
  const config = { ...DEFAULT_VERTICAL_LAYOUT, ...options };
  // Sort node IDs to guarantee determinism in layout regardless of input map iteration order
  const nodeIds = Array.from(graph.nodes.keys()).sort();
  const outgoing = new Map<string, string[]>();
  const incomingCounts = new Map<string, number>();

  for (const id of nodeIds) {
    outgoing.set(id, []);
    incomingCounts.set(id, 0);
  }

  for (const edge of graph.edges.values()) {
    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)!.push(edge.target);
    incomingCounts.set(edge.target, incomingCounts.get(edge.target)! + 1);
  }

  // Sort outgoing edges to guarantee deterministic traversal
  for (const neighbors of outgoing.values()) {
    neighbors.sort();
  }

  const depths = assignVerticalDepths(nodeIds, outgoing, incomingCounts);
  const layers = groupByDepth(nodeIds, depths);
  const positions = new Map<string, Point>();

  // Replace spread Math.max with iterative calculation to prevent Maximum Call Stack Size Exceeded
  // on very large graphs, and to avoid creating a large intermediate array.
  let maxLayerSize = 1;
  for (const ids of layers.values()) {
    if (ids.length > maxLayerSize) {
      maxLayerSize = ids.length;
    }
  }

  const maxLayerWidth =
    config.nodeWidth + Math.max(0, maxLayerSize - 1) * config.nodeSpacing;

  for (const [depth, ids] of layers) {
    const layerWidth =
      config.nodeWidth + Math.max(0, ids.length - 1) * config.nodeSpacing;
    const startX = config.margin + (maxLayerWidth - layerWidth) / 2;
    const y = config.margin + depth * config.layerSpacing;

    for (let i = 0; i < ids.length; i++) {
      positions.set(ids[i], {
        x: startX + i * config.nodeSpacing,
        y,
      });
    }
  }

  const layerCount = Math.max(1, layers.size);
  const width = maxLayerWidth + config.margin * 2;
  const height =
    config.nodeHeight +
    Math.max(0, layerCount - 1) * config.layerSpacing +
    config.margin * 2;

  return Object.freeze({
    positions,
    width,
    height,
    nodeSize: Object.freeze({
      width: config.nodeWidth,
      height: config.nodeHeight,
    }),
  });
}

/**
 * Result of calculating the geometric endpoints for a rendered edge.
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
  sourceOffsetPx: number = 0,
  targetOffsetPx: number = 0,
): EdgeEndpointsResult | null {
  const source = layout.positions.get(edge.source);
  const target = layout.positions.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const sourcePt = {
    x: source.x + layout.nodeSize.width / 2 + sourceOffsetPx,
    y: source.y + layout.nodeSize.height,
  };

  const targetPt = {
    x: target.x + layout.nodeSize.width / 2 + targetOffsetPx,
    y: target.y,
  };

  const path = routeEdgeOrthogonal(sourcePt, targetPt, layout);

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
): readonly Point[] {
  const margin = 20;

  const obstacles: { x: number; y: number; w: number; h: number }[] = [];
  for (const pos of layout.positions.values()) {
    obstacles.push({
      x: pos.x,
      y: pos.y,
      w: layout.nodeSize.width,
      h: layout.nodeSize.height,
    });
  }

  const xSet = new Set<number>();
  const ySet = new Set<number>();

  xSet.add(sourcePt.x);
  ySet.add(sourcePt.y);
  xSet.add(targetPt.x);
  ySet.add(targetPt.y);

  const sourceVerticalOffset = 60; // Extra visual weight before joint
  const targetVerticalOffset = 30;

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

  const xCoords = Array.from(xSet).sort((a, b) => a - b);
  const yCoords = Array.from(ySet).sort((a, b) => a - b);

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

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const curr = openList.shift()!;

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

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i];
      const nxIdx = curr.xIdx + d.dx;
      const nyIdx = curr.yIdx + d.dy;

      if (nxIdx >= 0 && nxIdx < xCoords.length && nyIdx >= 0 && nyIdx < yCoords.length) {
        if (curr.parent === null && (d.dx !== 0 || d.dy !== 1)) {
            continue;
        }

        if (nxIdx === endXIdx && nyIdx === endYIdx) {
             if (curr.xIdx === nxIdx && curr.yIdx === nyIdx - 1) {
                // OK
             } else {
                 if (d.dx !== 0 || d.dy !== 1) continue;
             }
        }

        const x1 = xCoords[curr.xIdx];
        const y1 = yCoords[curr.yIdx];
        const x2 = xCoords[nxIdx];
        const y2 = yCoords[nyIdx];

        if (!isSegmentValid(x1, y1, x2, y2)) continue;

        const dist = Math.abs(x2 - x1) + Math.abs(y2 - y1);
        let penalty = 0;
        if (curr.parent !== null && (curr.dirX !== d.dx || curr.dirY !== d.dy)) {
          penalty = 50;
        }

        const g = curr.g + dist + penalty;
        const h = Math.abs(xCoords[endXIdx] - x2) + Math.abs(yCoords[endYIdx] - y2);
        const f = g + h;

        openList.push({ xIdx: nxIdx, yIdx: nyIdx, g, f, parent: curr, dirX: d.dx, dirY: d.dy });
      }
    }
  }

  return Object.freeze([
    sourcePt,
    { x: sourcePt.x, y: sourcePt.y + sourceVerticalOffset },
    { x: targetPt.x, y: targetPt.y - targetVerticalOffset },
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
  incomingCounts: ReadonlyMap<string, number>,
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

  const roots = nodeIds.filter((id) => incomingCounts.get(id) === 0);
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
      if (incomingCounts.get(id) === 0) {
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

  let nextDepth = currentMaxDepth + 1;
  for (const id of fakeRoots) {
    if (!depths.has(id)) {
      depths.set(id, nextDepth);
      queue.push(id);
    }
  }

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

  return new Map(Array.from(layers.entries()).sort(([a], [b]) => a - b));
}

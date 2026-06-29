import type { Graph, GraphEdge } from "./model";
import { toReadonlyMap } from "./readonly-map";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
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
  readonly positions: ReadonlyMap<string, Point>;
  readonly width: number;
  readonly height: number;
  readonly nodeSize: Size;
}

/**
 * Configuration options for the vertical layout algorithm.
 *
 * Allows tuning of node dimensions and spacing layers to fit varying label sizes
 * or density preferences.
 */
export interface VerticalLayoutOptions {
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
  readonly layerSpacing?: number;
  readonly nodeSpacing?: number;
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
 * This function assigns an `(x, y)` coordinate to each node by organizing
 * them into depth layers (e.g., BFS layering) and distributing them horizontally.
 *
 * @param graph The logical graph to lay out.
 * @param options Dimensions and spacing parameters.
 * @returns A computed `LayoutSnapshot` containing absolute coordinates for all nodes.
 */
export function verticalLayout(
  graph: Graph,
  options: VerticalLayoutOptions = {},
): LayoutSnapshot {
  const config = { ...DEFAULT_VERTICAL_LAYOUT, ...options };
  const nodeIds = Array.from(graph.nodes.keys());
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

    outgoing.get(edge.source)?.push(edge.target);
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1);
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

    ids.forEach((id, index) => {
      positions.set(id, {
        x: startX + index * config.nodeSpacing,
        y,
      });
    });
  }

  const layerCount = Math.max(1, layers.size);
  const width = maxLayerWidth + config.margin * 2;
  const height =
    config.nodeHeight +
    Math.max(0, layerCount - 1) * config.layerSpacing +
    config.margin * 2;

  return Object.freeze({
    positions: toReadonlyMap(positions),
    width,
    height,
    nodeSize: Object.freeze({
      width: config.nodeWidth,
      height: config.nodeHeight,
    }),
  });
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
 * @returns The geometric endpoints for the edge, or null if the connected nodes are missing from the layout.
 */
export function edgeEndpoints(
  edge: GraphEdge,
  layout: LayoutSnapshot,
): { readonly source: Point; readonly target: Point } | null {
  const source = layout.positions.get(edge.source);
  const target = layout.positions.get(edge.target);

  if (!source || !target) {
    return null;
  }

  return {
    source: {
      x: source.x + layout.nodeSize.width / 2,
      y: source.y + layout.nodeSize.height,
    },
    target: {
      x: target.x + layout.nodeSize.width / 2,
      y: target.y,
    },
  };
}

function assignVerticalDepths(
  nodeIds: readonly string[],
  outgoing: ReadonlyMap<string, readonly string[]>,
  incomingCounts: ReadonlyMap<string, number>,
): ReadonlyMap<string, number> {
  const depths = new Map<string, number>();
  const roots = nodeIds.filter((id) => (incomingCounts.get(id) ?? 0) === 0);
  const starts = roots.length > 0 ? roots : nodeIds.slice(0, 1);

  let currentMaxDepth = -1;

  for (const id of starts) {
    const maxDepthReached = visitComponent(id, 0, outgoing, depths);
    if (maxDepthReached > currentMaxDepth) {
      currentMaxDepth = maxDepthReached;
    }
  }

  for (const id of nodeIds) {
    if (!depths.has(id)) {
      const nextDepth = currentMaxDepth + 1;
      const maxDepthReached = visitComponent(id, nextDepth, outgoing, depths);
      if (maxDepthReached > currentMaxDepth) {
        currentMaxDepth = maxDepthReached;
      }
    }
  }

  return depths;
}

function visitComponent(
  startId: string,
  startDepth: number,
  outgoing: ReadonlyMap<string, readonly string[]>,
  depths: Map<string, number>,
): number {
  const queue: string[] = [startId];
  let maxDepthReached = startDepth;

  if (!depths.has(startId)) {
    depths.set(startId, startDepth);
  } else {
    maxDepthReached = depths.get(startId)!;
  }

  for (let index = 0; index < queue.length; index += 1) {
    const sourceId = queue[index];
    const sourceDepth = depths.get(sourceId) ?? startDepth;

    if (sourceDepth > maxDepthReached) {
      maxDepthReached = sourceDepth;
    }

    for (const targetId of outgoing.get(sourceId) ?? []) {
      if (depths.has(targetId)) {
        continue;
      }

      const targetDepth = sourceDepth + 1;
      depths.set(targetId, targetDepth);
      if (targetDepth > maxDepthReached) {
        maxDepthReached = targetDepth;
      }
      queue.push(targetId);
    }
  }

  return maxDepthReached;
}

function groupByDepth(
  nodeIds: readonly string[],
  depths: ReadonlyMap<string, number>,
): ReadonlyMap<number, readonly string[]> {
  const layers = new Map<number, string[]>();

  for (const id of nodeIds) {
    const depth = depths.get(id) ?? 0;
    const layer = layers.get(depth) ?? [];

    layer.push(id);
    layers.set(depth, layer);
  }

  return new Map(Array.from(layers.entries()).sort(([a], [b]) => a - b));
}

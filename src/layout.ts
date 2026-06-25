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

export interface LayoutSnapshot {
  readonly positions: ReadonlyMap<string, Point>;
  readonly width: number;
  readonly height: number;
  readonly nodeSize: Size;
}

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
  const maxLayerSize = Math.max(1, ...Array.from(layers.values(), (ids) => ids.length));
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

  for (const id of starts) {
    visitComponent(id, 0, outgoing, depths);
  }

  for (const id of nodeIds) {
    if (!depths.has(id)) {
      const nextDepth = Math.max(-1, ...depths.values()) + 1;
      visitComponent(id, nextDepth, outgoing, depths);
    }
  }

  return depths;
}

function visitComponent(
  startId: string,
  startDepth: number,
  outgoing: ReadonlyMap<string, readonly string[]>,
  depths: Map<string, number>,
): void {
  const queue: string[] = [startId];

  if (!depths.has(startId)) {
    depths.set(startId, startDepth);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const sourceId = queue[index];
    const sourceDepth = depths.get(sourceId) ?? startDepth;

    for (const targetId of outgoing.get(sourceId) ?? []) {
      if (depths.has(targetId)) {
        continue;
      }

      depths.set(targetId, sourceDepth + 1);
      queue.push(targetId);
    }
  }
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

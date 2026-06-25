import { toReadonlyMap } from "./readonly-map";

export type AttributeValue = string | number | boolean | bigint | null;

export type AttributeMap = Readonly<Record<string, AttributeValue>>;

export interface GraphElement {
  readonly id: string;
  readonly tags: readonly string[];
  readonly attributes: AttributeMap;
}

export interface GraphNode extends GraphElement {
  readonly parent?: string;
}

export interface GraphEdge extends GraphElement {
  readonly source: string;
  readonly target: string;
}

export interface Graph {
  readonly nodes: ReadonlyMap<string, GraphNode>;
  readonly edges: ReadonlyMap<string, GraphEdge>;
}

export interface GraphSnapshot extends Graph {
  readonly graphId: string;
  readonly version: string | number;
}

export interface GraphElementJson {
  readonly id: string;
  readonly tags?: readonly string[];
  readonly attributes?: Readonly<Record<string, AttributeValue>>;
}

export interface GraphNodeJson extends GraphElementJson {
  readonly parent?: string;
}

export interface GraphEdgeJson extends GraphElementJson {
  readonly source: string;
  readonly target: string;
}

export interface GraphSnapshotJson {
  readonly graphId: string;
  readonly version: string | number;
  readonly nodes: readonly GraphNodeJson[];
  readonly edges: readonly GraphEdgeJson[];
}

export class GraphModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphModelError";
  }
}

export function createGraphSnapshot(input: GraphSnapshotJson): GraphSnapshot {
  assertNonEmptyString(input.graphId, "graphId");

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const node of input.nodes) {
    const normalized = normalizeNode(node);

    if (nodes.has(normalized.id)) {
      throw new GraphModelError(`Duplicate node id "${normalized.id}".`);
    }

    nodes.set(normalized.id, normalized);
  }

  for (const node of nodes.values()) {
    if (node.parent !== undefined && !nodes.has(node.parent)) {
      throw new GraphModelError(
        `Node "${node.id}" references missing parent "${node.parent}".`,
      );
    }
  }

  for (const edge of input.edges) {
    const normalized = normalizeEdge(edge);

    if (edges.has(normalized.id)) {
      throw new GraphModelError(`Duplicate edge id "${normalized.id}".`);
    }

    if (!nodes.has(normalized.source)) {
      throw new GraphModelError(
        `Edge "${normalized.id}" references missing source "${normalized.source}".`,
      );
    }

    if (!nodes.has(normalized.target)) {
      throw new GraphModelError(
        `Edge "${normalized.id}" references missing target "${normalized.target}".`,
      );
    }

    edges.set(normalized.id, normalized);
  }

  return Object.freeze({
    graphId: input.graphId,
    version: input.version,
    nodes: toReadonlyMap(nodes),
    edges: toReadonlyMap(edges),
  });
}

export function graphSnapshotFromJson(input: GraphSnapshotJson): GraphSnapshot {
  return createGraphSnapshot(input);
}

export function graphSnapshotToJson(snapshot: GraphSnapshot): GraphSnapshotJson {
  return {
    graphId: snapshot.graphId,
    version: snapshot.version,
    nodes: Array.from(snapshot.nodes.values(), (node) => ({
      id: node.id,
      tags: node.tags,
      attributes: node.attributes,
      ...(node.parent === undefined ? {} : { parent: node.parent }),
    })),
    edges: Array.from(snapshot.edges.values(), (edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      tags: edge.tags,
      attributes: edge.attributes,
    })),
  };
}

function normalizeNode(node: GraphNodeJson): GraphNode {
  assertNonEmptyString(node.id, "node.id");

  if (node.parent !== undefined) {
    assertNonEmptyString(node.parent, `node "${node.id}" parent`);
  }

  return Object.freeze({
    id: node.id,
    parent: node.parent,
    tags: freezeTags(node.tags),
    attributes: freezeAttributes(node.attributes),
  });
}

function normalizeEdge(edge: GraphEdgeJson): GraphEdge {
  assertNonEmptyString(edge.id, "edge.id");
  assertNonEmptyString(edge.source, `edge "${edge.id}" source`);
  assertNonEmptyString(edge.target, `edge "${edge.id}" target`);

  return Object.freeze({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    tags: freezeTags(edge.tags),
    attributes: freezeAttributes(edge.attributes),
  });
}

function freezeTags(tags: readonly string[] = []): readonly string[] {
  return Object.freeze(
    tags.map((tag, index) => {
      assertNonEmptyString(tag, `tag at index ${index}`);
      return tag;
    }),
  );
}

function freezeAttributes(
  attributes: Readonly<Record<string, AttributeValue>> = {},
): AttributeMap {
  for (const [key, value] of Object.entries(attributes)) {
    assertNonEmptyString(key, "attribute key");

    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      typeof value !== "bigint"
    ) {
      throw new GraphModelError(
        `Attribute "${key}" has unsupported value type "${typeof value}".`,
      );
    }
  }

  return Object.freeze({ ...attributes });
}

function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GraphModelError(`${fieldName} must be a non-empty string.`);
  }
}

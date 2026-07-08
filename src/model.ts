/**
 * Represents a primitive value that can be assigned to an attribute on a graph element.
 * Supported types include strings, booleans, and specific object wrappers for integers, floats, and bytes.
 */
export type AttributeValue =
  | string
  | boolean
  /** Represents a signed integer to avoid JavaScript floating-point ambiguity. */
  | {
      /** The signed integer value. */
      integer: number;
    }
  /** Represents a floating-point number. */
  | {
      /** The floating-point value. */
      float: number;
    }
  /** Represents a base64 encoded byte array. */
  | {
      /** The base64 encoded byte string. */
      bytes: string;
    };

/**
 * An immutable key-value map representing domain-specific data attached to a graph element.
 */
export type AttributeMap = Readonly<Record<string, AttributeValue>>;

/**
 * Represents a single node within a graph.
 *
 * Nodes are the primary entities in a graph. The `parent` property allows nodes
 * to represent hierarchical containment (compound graphs).
 *
 * **Invariants**:
 * - If `parent` is defined, it must refer to a valid node ID existing in the same graph.
 */
export interface GraphNode {
  /**
   * The globally unique identifier for this node within the graph.
   * Producer-assigned IDs are sacred and determine identity.
   */
  readonly id: string;

  /**
   * An immutable list of semantic tags.
   * Tags are converted into CSS classes during rendering for styling.
   */
  readonly tags: readonly string[];

  /**
   * Domain-specific metadata attached to this node.
   */
  readonly attributes: AttributeMap;

  /**
   * The optional ID of a parent node, used for representing hierarchical containment
   * in compound graphs.
   */
  readonly parent?: string;
}

/**
 * Represents a directed connection between two nodes in a graph.
 *
 * Edges model relationships or flows between nodes.
 *
 * **Invariants**:
 * - `source` must refer to a valid node ID in the same graph.
 * - `target` must refer to a valid node ID in the same graph.
 */
export interface GraphEdge {
  /**
   * The globally unique identifier for this edge within the graph.
   * Producer-assigned IDs are sacred and determine identity.
   */
  readonly id: string;

  /**
   * An immutable list of semantic tags.
   * Tags are converted into CSS classes during rendering for styling.
   */
  readonly tags: readonly string[];

  /**
   * Domain-specific metadata attached to this edge.
   */
  readonly attributes: AttributeMap;

  /**
   * The ID of the node where this edge originates.
   */
  readonly source: string;

  /**
   * The ID of the node where this edge terminates.
   */
  readonly target: string;
}

/**
 * Represents an immutable, basic graph structure consisting of nodes and edges.
 *
 * This interface serves as the foundational mathematical representation of the graph,
 * disconnected from any specific versioning or rendering state.
 */
export interface GraphSchema {
  /**
   * Tags that should be treated as containment relationships.
   */
  readonly containment?: readonly string[];
}

/**
 * JSON serialization representation of a graph schema.
 */
export interface GraphSchemaJson {
  /**
   * Tags that should be treated as containment relationships.
   */
  readonly containment?: readonly string[];
}

/**
 * Represents a specific, immutable point-in-time version of a graph.
 *
 * Since graphs are immutable in this library, any changes to a graph result
 * in a new `GraphSnapshot` with an updated `version`.
 *
 * **Usage**: Use this type when interacting with the renderer or layout engines,
 * as it ensures the data cannot be mutated out-from-under the view state.
 */
export interface GraphSnapshot {
  /**
   * A read-only map of all nodes in the graph, keyed by their unique IDs.
   */
  readonly nodes: ReadonlyMap<string, GraphNode>;

  /**
   * A read-only map of all edges in the graph, keyed by their unique IDs.
   */
  readonly edges: ReadonlyMap<string, GraphEdge>;

  /**
   * The unique identifier for the entire logical graph series.
   */
  readonly graphId: string;

  /**
   * An identifier representing this specific point-in-time state.
   */
  readonly version: string | number;

  /**
   * Optional schema definition for the graph.
   */
  readonly schema?: GraphSchema;
}

/**
 * A JSON-serializable representation of a graph node.
 */
export interface GraphNodeJson {
  /**
   * The unique identifier for this node.
   */
  readonly id: string;

  /**
   * Optional semantic tags for the node.
   */
  readonly tags?: readonly string[];

  /**
   * Optional domain-specific metadata.
   */
  readonly attributes?: Readonly<Record<string, AttributeValue>>;

  /**
   * The optional ID of the parent node.
   */
  readonly parent?: string;
}

/**
 * A JSON-serializable representation of a directed graph edge.
 */
export interface GraphEdgeJson {
  /**
   * The unique identifier for this edge.
   */
  readonly id: string;

  /**
   * Optional semantic tags for the edge.
   */
  readonly tags?: readonly string[];

  /**
   * Optional domain-specific metadata.
   */
  readonly attributes?: Readonly<Record<string, AttributeValue>>;

  /**
   * The ID of the node where this edge originates.
   */
  readonly source: string;

  /**
   * The ID of the node where this edge terminates.
   */
  readonly target: string;
}

/**
 * A JSON-serializable representation of an entire `GraphSnapshot`.
 */
export interface GraphSnapshotJson {
  /**
   * The unique identifier for the entire logical graph series.
   */
  readonly graphId: string;

  /**
   * An identifier representing this specific point-in-time state.
   */
  readonly version: string | number;

  /**
   * Optional schema definition for the graph.
   */
  readonly schema?: GraphSchemaJson;

  /**
   * The list of nodes in this snapshot.
   */
  readonly nodes: readonly GraphNodeJson[];

  /**
   * The list of edges in this snapshot.
   */
  readonly edges: readonly GraphEdgeJson[];
}

/**
 * Represents an incremental set of changes (additions and removals) to be applied
 * to a `GraphSnapshot`.
 *
 * This exists to support incremental rendering and updates without needing to
 * transmit or reconstruct the entire graph layout.
 *
 * **Invariants**:
 * - Removals are processed before additions.
 * - Added elements must not share an ID with existing elements after removals are processed.
 */
export interface GraphDiff {
  /**
   * The list of new nodes to insert into the graph.
   */
  readonly addedNodes: readonly GraphNode[];

  /**
   * The list of new edges to insert into the graph.
   */
  readonly addedEdges: readonly GraphEdge[];

  /**
   * The list of node IDs to remove from the graph.
   */
  readonly removedNodes: readonly string[];

  /**
   * The list of edge IDs to remove from the graph.
   */
  readonly removedEdges: readonly string[];

}

/**
 * A JSON-serializable representation of a `GraphDiff`.
 */
export interface GraphDiffJson {
  /**
   * The list of new nodes to insert.
   */
  readonly addedNodes?: readonly GraphNodeJson[];

  /**
   * The list of new edges to insert.
   */
  readonly addedEdges?: readonly GraphEdgeJson[];

  /**
   * The list of node IDs to remove.
   */
  readonly removedNodes?: readonly string[];

  /**
   * The list of edge IDs to remove.
   */
  readonly removedEdges?: readonly string[];

}

/**
 * Represents a violation of structural graph invariants (e.g., duplicate IDs,
 * missing parent nodes, or dangling edges).
 */
export class GraphModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphModelError";
  }
}

/**
 * Creates an immutable `GraphSnapshot` from a JSON payload, validating all structural invariants.
 *
 * This function enforces uniqueness of IDs, verifies that all edge endpoints point to valid
 * nodes, and checks that parent nodes exist. It also sanitizes string attributes.
 *
 * @param input The JSON payload representing the graph.
 * @returns A frozen, validated `GraphSnapshot`.
 * @throws {GraphModelError} If duplicate IDs are found, or references (edges, parents) are invalid.
 */
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

  const base: any = {
    graphId: input.graphId,
    version: input.version,
    nodes,
    edges,
  };
  if (input.schema) {
    base.schema = Object.freeze({ ...input.schema });
  }

  return Object.freeze(base as GraphSnapshot);
}


/**
 * Serializes a `GraphSnapshot` into a JSON-compatible object.
 *
 * @param snapshot The graph snapshot to serialize.
 * @returns A plain `GraphSnapshotJson` object.
 */
export function graphSnapshotToJson(snapshot: GraphSnapshot): GraphSnapshotJson {
  const result: any = {
    graphId: snapshot.graphId,
    version: snapshot.version,
  };
  if (snapshot.schema) {
    result.schema = { ...snapshot.schema };
  }
  result.nodes = Array.from(snapshot.nodes.values(), (node) => {
    // We use a mutable type here to avoid spread operator allocations, then it gets implicitly cast.
    const n: { id: string; tags: readonly string[]; attributes: Readonly<Record<string, unknown>>; parent?: string } = {
      id: node.id,
      tags: node.tags,
      attributes: node.attributes,
    };
    if (node.parent !== undefined) {
      n.parent = node.parent;
    }
    return n as GraphNodeJson;
  });

  result.edges = Array.from(snapshot.edges.values(), (edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    tags: edge.tags,
    attributes: edge.attributes,
  }));

  return result as GraphSnapshotJson;
}

/**
 * Validates and freezes a JSON representation of a graph difference.
 *
 * @param input The JSON payload representing the diff.
 * @returns An immutable `GraphDiff`.
 * @throws {GraphModelError} If the diff contains invalid data.
 */
export function createGraphDiff(input: GraphDiffJson): GraphDiff {
  const addedNodes = (input.addedNodes || []).map(normalizeNode);
  const addedNodesIds = new Set<string>();
  for (const node of addedNodes) {
    if (addedNodesIds.has(node.id)) {
      throw new GraphModelError(`Duplicate node id "${node.id}".`);
    }
    addedNodesIds.add(node.id);
  }

  const addedEdges = (input.addedEdges || []).map(normalizeEdge);
  const addedEdgesIds = new Set<string>();
  for (const edge of addedEdges) {
    if (addedEdgesIds.has(edge.id)) {
      throw new GraphModelError(`Duplicate edge id "${edge.id}".`);
    }
    addedEdgesIds.add(edge.id);
  }

  const removedNodesIds = new Set<string>();
  const removedNodes = (input.removedNodes || []).map((id) => {
    assertNonEmptyString(id, "removedNode id");
    if (removedNodesIds.has(id)) {
      throw new GraphModelError(`Duplicate node id "${id}".`);
    }
    removedNodesIds.add(id);
    return id;
  });

  const removedEdgesIds = new Set<string>();
  const removedEdges = (input.removedEdges || []).map((id) => {
    assertNonEmptyString(id, "removedEdge id");
    if (removedEdgesIds.has(id)) {
      throw new GraphModelError(`Duplicate edge id "${id}".`);
    }
    removedEdgesIds.add(id);
    return id;
  });

  return Object.freeze({
    addedNodes: Object.freeze(addedNodes),
    addedEdges: Object.freeze(addedEdges),
    removedNodes: Object.freeze(removedNodes),
    removedEdges: Object.freeze(removedEdges),
  });
}

/**
 * Serializes a `GraphDiff` into a JSON-compatible object.
 *
 * @param diff The diff to serialize.
 * @returns A plain `GraphDiffJson` object.
 */
export function graphDiffToJson(diff: GraphDiff): GraphDiffJson {
  return {
    addedNodes: diff.addedNodes.map((node) => {
      // PERF(Bolt): Replaced object spread syntax (...(condition ? { key: val } : {}))
      // with explicit assignment to avoid excessive object allocations and GC churn
      // when processing a large number of nodes.
      const n: { id: string; tags: readonly string[]; attributes: Readonly<Record<string, unknown>>; parent?: string } = {
        id: node.id,
        tags: node.tags,
        attributes: node.attributes,
      };
      if (node.parent !== undefined) {
        n.parent = node.parent;
      }
      return n as GraphNodeJson;
    }),
    addedEdges: diff.addedEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      tags: edge.tags,
      attributes: edge.attributes,
    })),
    removedNodes: [...diff.removedNodes],
    removedEdges: [...diff.removedEdges],
  };
}

/**
 * Applies a set of structural changes (`GraphDiff`) to an existing `GraphSnapshot`,
 * returning a new, immutable `GraphSnapshot`.
 *
 * This operation is functional; it does not mutate the original snapshot.
 *
 * @param snapshot The starting graph state.
 * @param diff The incremental changes to apply (removals happen before additions).
 * @param newVersion The version identifier to assign to the new snapshot.
 * @returns A new, frozen `GraphSnapshot` incorporating the changes.
 * @throws {GraphModelError} If the diff introduces duplicate IDs or invalid references.
 */
export function applyGraphDiff(
  snapshot: GraphSnapshot,
  diff: GraphDiff,
  newVersion: string | number
): GraphSnapshot {
  const nodes = new Map<string, GraphNode>(snapshot.nodes);
  const edges = new Map<string, GraphEdge>(snapshot.edges);

  for (const id of diff.removedEdges) {
    edges.delete(id);
  }

  for (const id of diff.removedNodes) {
    nodes.delete(id);
  }

  for (const node of diff.addedNodes) {
    if (nodes.has(node.id)) {
      throw new GraphModelError(`Cannot add node: duplicate node id "${node.id}".`);
    }
    nodes.set(node.id, node);
  }

  for (const edge of diff.addedEdges) {
    if (edges.has(edge.id)) {
      throw new GraphModelError(`Cannot add edge: duplicate edge id "${edge.id}".`);
    }
    edges.set(edge.id, edge);
  }

  // Validate structural invariants across the ENTIRE new graph state,
  // not just the newly added elements. This ensures removals didn't orphan anything.
  for (const node of nodes.values()) {
    if (node.parent !== undefined && !nodes.has(node.parent)) {
      throw new GraphModelError(
        `Node "${node.id}" references missing parent "${node.parent}".`,
      );
    }
  }

  for (const edge of edges.values()) {
    if (!nodes.has(edge.source)) {
      throw new GraphModelError(`Edge "${edge.id}" references missing source "${edge.source}".`);
    }
    if (!nodes.has(edge.target)) {
      throw new GraphModelError(`Edge "${edge.id}" references missing target "${edge.target}".`);
    }
  }

  const base: any = {
    graphId: snapshot.graphId,
    version: newVersion,
    nodes,
    edges,
  };
  if (snapshot.schema) {
    base.schema = Object.freeze({ ...snapshot.schema });
  }

  return Object.freeze(base as GraphSnapshot);
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
  const sanitizedAttributes: Record<string, AttributeValue> = Object.create(null);

  for (const key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      assertNonEmptyString(key, "attribute key");

      const value = attributes[key];

      let isValid = false;
      if (typeof value === "string" || typeof value === "boolean") {
        isValid = true;
      } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 1) {
          const innerKey = keys[0];
          if (innerKey === "integer" && typeof (value as any).integer === "number") isValid = true;
          else if (innerKey === "float" && typeof (value as any).float === "number") isValid = true;
          else if (innerKey === "bytes" && typeof (value as any).bytes === "string") isValid = true;
        }
      }

      if (!isValid) {
        throw new GraphModelError(
          `Attribute "${key}" has unsupported value type.`,
        );
      }

      if (typeof value === "string") {
        sanitizedAttributes[key] = sanitizeString(value);
      } else if (typeof value === "object" && value !== null) {
        if ("bytes" in value) {
          sanitizedAttributes[key] = Object.freeze({ bytes: sanitizeString((value as any).bytes) });
        } else if ("integer" in value) {
          sanitizedAttributes[key] = Object.freeze({ integer: (value as any).integer });
        } else if ("float" in value) {
          sanitizedAttributes[key] = Object.freeze({ float: (value as any).float });
        }
      } else {
        sanitizedAttributes[key] = value;
      }
    }
  }

  return Object.freeze(sanitizedAttributes);
}


/**
 * Decodes HTML entities (both decimal and hexadecimal) in a given string
 * into their corresponding characters.
 *
 * @param text The string containing HTML entities to decode.
 * @returns The decoded string.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n')
    .replace(/&#(\d+);?/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    })
    .replace(/&#x([0-9a-f]+);?/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Safely sanitizes a string to prevent Cross-Site Scripting (XSS) attacks.
 *
 * This function handles complex bypass attempts (like double URL encoding or
 * mixed entity/URL encoding) by repeatedly decoding HTML and URL entities
 * until the string stabilizes. It strips out disallowed tags (e.g., `<script>`),
 * removes control characters, and validates that no restricted URI schemes
 * are present.
 *
 * @param value The string to sanitize.
 * @returns The sanitized string safe for rendering.
 * @throws {TypeError} If the input value is not a string.
 */
export function sanitizeString(value: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected string but received ${typeof value}`);
  }

  if (value.length > 100_000) {
    throw new GraphModelError("String exceeds maximum allowed length to prevent denial of service.");
  }

  // Strip <script> tags (iterative to prevent nested bypasses like <scr<script>ipt>)
  let sanitized = value;
  let previous;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(/<\/?script\b[^>]*>/gi, "");
  } while (sanitized !== previous);

  // Strip inline event handlers (on*)
  sanitized = sanitized.replace(/\bon[a-z]+\s*=/gi, "data-blocked=");

  // Strip CSS expressions
  sanitized = sanitized.replace(/expression\s*\(/gi, "blocked-expr(");

  // Basic XSS/script sanitization on the stripped payload
  let clean = sanitized;

  // Repeatedly decode HTML entities and URL encoding until no changes are made.
  // This handles bypasses like double URL encoding or mixed entity/URL encoding.
  let previousClean;
  do {
    previousClean = clean;

    // First decode HTML entities, as browsers process them before URL encoding
    clean = decodeHtmlEntities(clean);

    // Then decode URL encoding, handling malformed sequences gracefully
    clean = clean.replace(/%([0-9A-F]{2})/gi, (match) => {
      try {
        return decodeURIComponent(match);
      } catch {
        return match;
      }
    });
  } while (clean !== previousClean);

  clean = clean.replace(/[\s\x00-\x1F\x7F]+/g, "").toLowerCase();

  // Block common javascript URIs and inline scripts
  if (clean.includes("javascript:") || clean.includes("vbscript:") || clean.includes("data:text/html")) {
    return "#blocked-uri";
  }

  return sanitized;
}

function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value === "string") {
    const sanitized = sanitizeString(value);
    if (sanitized !== value) {
      throw new GraphModelError(`${fieldName} contains unsafe content.`);
    }
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GraphModelError(`${fieldName} must be a non-empty string.`);
  }
}

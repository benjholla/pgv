/**
 * @module
 * @packageDocumentation
 * Core immutable models for representing graphs and their differences.
 */

/**
 * Represents a primitive value that can be assigned to an attribute on a graph element.
 *
 * This type acts as a disjoint union to ensure unambiguous serialization and type safety
 * when transferring data from external analysis systems into the visualization layer.
 * Supported types include strings, booleans, and specific object wrappers for numbers and byte arrays.
 */
export type AttributeValue =
  | string
  | boolean
  /** Represents a signed integer, wrapped to avoid JavaScript floating-point ambiguity during serialization. */
  | {
      /** The signed integer value. */
      integer: number;
    }
  /** Represents a floating-point number. */
  | {
      /** The floating-point value. */
      float: number;
    }
  /** Represents a base64 encoded byte array for embedding raw data. */
  | {
      /** The base64 encoded byte string. */
      bytes: string;
    };

/**
 * An immutable key-value map representing domain-specific data attached to a graph element.
 *
 * This structure allows arbitrary metadata (e.g., source file lines, analysis weights, types)
 * to be associated with nodes and edges without interfering with the core graph topology.
 * The map is entirely immutable to guarantee predictable rendering and safe caching.
 */
export type AttributeMap = Readonly<Record<string, AttributeValue>>;

/**
 * Represents a single node within a graph.
 *
 * Nodes are the primary entities in a graph.
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
 * in a new `GraphSnapshot`.
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
 * Error thrown when a graph model invariant or structural constraint is violated.
 *
 * Common causes include:
 * - Duplicate element IDs.
 * - Edges referencing non-existent source or target nodes.
 * - Unsafe or excessively large string attributes triggering security constraints.
 */
export class GraphModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphModelError";
  }
}

/**
 * Validates that the node containment hierarchy does not contain cycles.
 *
 * @param nodes A map of graph nodes to validate.
 * @throws {GraphModelError} If a containment cycle is detected.
 */
function validateStructuralInvariants(
  nodes: Map<string, GraphNode>,
  edges: IterableIterator<GraphEdge>,
  schema?: GraphSchema | GraphSchemaJson
) {
  // Build adjacency list for containment edges
  const containmentAdjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const nodeId of nodes.keys()) {
    containmentAdjacency.set(nodeId, []);
    inDegree.set(nodeId, 0);
  }

  // PERF(Bolt): Consolidate structural validation and containment adjacency building
  // into a single pass over the edge iterable to avoid Array.from() allocation.
  const containmentSet = schema?.containment ? new Set(schema.containment) : null;

  for (const edge of edges) {
    if (!nodes.has(edge.source)) {
      throw new GraphModelError(`Edge "${edge.id}" references missing source "${edge.source}".`);
    }
    if (!nodes.has(edge.target)) {
      throw new GraphModelError(`Edge "${edge.id}" references missing target "${edge.target}".`);
    }

    if (containmentSet && isContainmentEdge(edge, containmentSet)) {
      containmentAdjacency.get(edge.source)!.push(edge.target);

      const currentInDegree = inDegree.get(edge.target)! + 1;
      if (currentInDegree > 1) {
        throw new GraphModelError(`Containment invariant violation: Node "${edge.target}" has multiple parent nodes.`);
      }
      inDegree.set(edge.target, currentInDegree);
    }
  }

  const roots: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      roots.push(nodeId);
    }
  }

  // A generic reachability traversal (traverseDfs) safely detects cycles here because
  // the graph is constrained to a maximum in-degree of 1 (a forest).
  // In a forest, any node in a cycle will have exactly an in-degree of 1 from within the cycle.
  // Therefore, no node in a cycle is reachable from any root (in-degree 0).
  // If the number of visited nodes from all roots is less than the total nodes,
  // the unvisited nodes must be part of (or downstream from) a disjoint cycle.
  const visited = traverseDfs(roots, (id) => containmentAdjacency.get(id));

  if (visited.size !== nodes.size) {
    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        throw new GraphModelError(`Containment cycle detected involving node "${nodeId}".`);
      }
    }
  }
}

/**
 * Creates an immutable `GraphSnapshot` from a JSON payload, validating all structural invariants.
 *
 * This function enforces uniqueness of IDs, verifies that all edge endpoints point to valid
 * nodes. It also sanitizes string attributes.
 *
 * @example
 * ```typescript
 * const snapshot = createGraphSnapshot({
 *   nodes: [
 *     { id: "A", tags: ["start"], attributes: { label: "Start Node" } },
 *     { id: "B", tags: ["end"] }
 *   ],
 *   edges: [
 *     { id: "e1", source: "A", target: "B" }
 *   ]
 * });
 * console.log(snapshot.nodes.get("A")?.attributes.label); // "Start Node"
 * ```
 *
 * @param input The JSON payload representing the graph.
 * @returns A frozen, validated `GraphSnapshot`.
 * @throws {GraphModelError} If duplicate IDs are found, or references (edges) are invalid.
 */
function buildItemMap<T, U extends { id: string }>(
  items: readonly T[],
  normalize: (item: T) => U,
  itemTypeName: string
): Map<string, U> {
  const map = new Map<string, U>();
  for (const item of items) {
    const normalized = normalize(item);
    if (map.has(normalized.id)) {
      throw new GraphModelError(`Duplicate ${itemTypeName} id "${normalized.id}".`);
    }
    map.set(normalized.id, normalized);
  }
  return map;
}

/**
 * Creates an immutable {@link GraphSnapshot} from a JSON representation.
 *
 * This function validates the structural invariants of the graph before returning
 * the snapshot. Specifically, it ensures that:
 * - All edge endpoints (source and target) reference valid nodes in the graph.
 * - Any specified containment hierarchies (defined in the schema) are strictly acyclic.
 *
 * @param input - The JSON representation of the graph snapshot.
 * @returns A structurally validated, immutable graph snapshot.
 * @throws {@link GraphModelError} if validation fails.
 */
export function createGraphSnapshot(input: GraphSnapshotJson): GraphSnapshot {
  const nodes = buildItemMap(input.nodes, normalizeNode, "node");
  const edges = buildItemMap(input.edges, normalizeEdge, "edge");

  validateStructuralInvariants(nodes, edges.values(), input.schema);

  const base: any = {
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
  };
  if (snapshot.schema) {
    result.schema = { ...snapshot.schema };
  }

  // PERF(Bolt): Avoid intermediate arrays and closures generated by Array.from
  // by using a pre-allocated array and a for...of loop for iteration
  const nodes = new Array(snapshot.nodes.size);
  let i = 0;
  for (const node of snapshot.nodes.values()) {
    nodes[i++] = nodeToJson(node);
  }
  // Sort deterministically
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  result.nodes = nodes;

  const edges = new Array(snapshot.edges.size);
  let j = 0;
  for (const edge of snapshot.edges.values()) {
    edges[j++] = edgeToJson(edge);
  }
  // Sort deterministically
  edges.sort((a, b) => a.id.localeCompare(b.id));
  result.edges = edges;

  return result as GraphSnapshotJson;
}

/**
 * Validates and freezes a JSON representation of a graph difference.
 *
 * @example
 * ```typescript
 * const diff = createGraphDiff({
 *   addedNodes: [{ id: "C", tags: ["middle"] }],
 *   removedEdges: ["e1"],
 *   addedEdges: [
 *     { id: "e2", source: "A", target: "C" },
 *     { id: "e3", source: "C", target: "B" }
 *   ]
 * });
 * console.log(diff.addedNodes.length); // 1
 * ```
 *
 * @param input The JSON payload representing the diff.
 * @returns An immutable `GraphDiff`.
 * @throws {GraphModelError} If the diff contains invalid data.
 */
function parseAddedItems<T, U extends { id: string }>(
  items: readonly T[] | undefined,
  normalize: (item: T) => U,
  itemTypeName: string
): U[] {
  const result: U[] = [];
  if (items) {
    const ids = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const item = normalize(items[i]);
      if (ids.has(item.id)) {
        throw new GraphModelError(`Duplicate ${itemTypeName} id "${item.id}".`);
      }
      ids.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function parseRemovedItems(
  items: readonly string[] | undefined,
  itemTypeName: string
): string[] {
  const result: string[] = [];
  if (items) {
    const ids = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const id = items[i];
      assertNonEmptyString(id, `${itemTypeName} id`);
      if (ids.has(id)) {
        throw new GraphModelError(`Duplicate ${itemTypeName} id "${id}".`);
      }
      ids.add(id);
      result.push(id);
    }
  }
  return result;
}

/**
 * Creates an immutable {@link GraphDiff} from a JSON representation.
 *
 * This function processes the JSON input, normalizes the added elements,
 * and ensures that the returned diff object and all its properties are deeply immutable.
 *
 * @param input - The JSON representation of the graph diff.
 * @returns An immutable graph diff containing additions and removals.
 * @throws {@link GraphModelError} if duplicate IDs are encountered within the added items.
 */
export function createGraphDiff(input: GraphDiffJson): GraphDiff {
  const addedNodes = parseAddedItems(input.addedNodes, normalizeNode, "node");
  const addedEdges = parseAddedItems(input.addedEdges, normalizeEdge, "edge");
  const removedNodes = parseRemovedItems(input.removedNodes, "node");
  const removedEdges = parseRemovedItems(input.removedEdges, "edge");

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
  const addedNodes: GraphNodeJson[] = [];
  for (let i = 0; i < diff.addedNodes.length; i++) {
    const node = diff.addedNodes[i];
    addedNodes.push(nodeToJson(node));
  }

  const addedEdges: GraphEdgeJson[] = [];
  for (let i = 0; i < diff.addedEdges.length; i++) {
    const edge = diff.addedEdges[i];
    addedEdges.push(edgeToJson(edge));
  }

  addedNodes.sort((a, b) => a.id.localeCompare(b.id));
  addedEdges.sort((a, b) => a.id.localeCompare(b.id));

  return {
    addedNodes,
    addedEdges,
    removedNodes: [...diff.removedNodes].sort((a, b) => a.localeCompare(b)),
    removedEdges: [...diff.removedEdges].sort((a, b) => a.localeCompare(b)),
  };
}

function nodeToJson(node: GraphNode): GraphNodeJson {
  // PERF(Bolt): Replaced object spread syntax (...(condition ? { key: val } : {}))
  // with explicit assignment to avoid excessive object allocations and GC churn
  // when processing a large number of nodes.
  const n: { id: string; tags: readonly string[]; attributes: Readonly<Record<string, unknown>> } = {
    id: node.id,
    tags: node.tags,
    attributes: node.attributes,
  };
  return n as GraphNodeJson;
}

function edgeToJson(edge: GraphEdge): GraphEdgeJson {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    tags: edge.tags,
    attributes: edge.attributes,
  };
}

/**
 * Applies a set of structural changes (`GraphDiff`) to an existing `GraphSnapshot`,
 * returning a new, immutable `GraphSnapshot`.
 *
 * This operation is functional; it does not mutate the original snapshot.
 *
 * @example
 * ```typescript
 * const nextSnapshot = applyGraphDiff(snapshot, diff);
 * console.log(nextSnapshot.nodes.has("C")); // true
 * console.log(nextSnapshot.edges.has("e1")); // false
 * ```
 *
 * @param snapshot The starting graph state.
 * @param diff The incremental changes to apply (removals happen before additions).
 * @returns A new, frozen `GraphSnapshot` incorporating the changes.
 * @throws {GraphModelError} If the diff introduces duplicate IDs or invalid references.
 */
export function applyGraphDiff(
  snapshot: GraphSnapshot,
  diff: GraphDiff
): GraphSnapshot {
  const nodes = new Map(snapshot.nodes);
  const edges = new Map(snapshot.edges);

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
  validateStructuralInvariants(nodes, edges.values(), snapshot.schema);

  const base: any = {
    nodes,
    edges,
  };
  if (snapshot.schema) {
    base.schema = Object.freeze({ ...snapshot.schema });
  }

  return Object.freeze(base as GraphSnapshot);
}

/**
 * Computes the exact mathematical inverse of a diff given the base snapshot it was applied to.
 *
 * What was removed by the original diff is added back (with identical data from the original state).
 * What was added by the original diff is removed.
 *
 * @param base The starting graph state before the diff was applied.
 * @param diff The incremental changes that were applied.
 * @returns A new, frozen `GraphDiff` representing the inverse operation.
 * @throws {GraphModelError} If the diff removes elements that do not exist in the base snapshot.
 */
export function invertGraphDiff(base: GraphSnapshot, diff: GraphDiff): GraphDiff {
  // PERF(Bolt): Avoid Array.map() closures and dynamic allocations in hot diffing loops
  const addedNodes = new Array(diff.removedNodes.length);
  for (let i = 0; i < diff.removedNodes.length; i++) {
    const id = diff.removedNodes[i];
    const node = base.nodes.get(id);
    if (!node) throw new GraphModelError(`Cannot invert diff: Node "${id}" not found in base snapshot.`);
    addedNodes[i] = node;
  }

  const addedEdges = new Array(diff.removedEdges.length);
  for (let i = 0; i < diff.removedEdges.length; i++) {
    const id = diff.removedEdges[i];
    const edge = base.edges.get(id);
    if (!edge) throw new GraphModelError(`Cannot invert diff: Edge "${id}" not found in base snapshot.`);
    addedEdges[i] = edge;
  }

  const removedNodes = new Array(diff.addedNodes.length);
  for (let i = 0; i < diff.addedNodes.length; i++) {
    removedNodes[i] = diff.addedNodes[i].id;
  }

  const removedEdges = new Array(diff.addedEdges.length);
  for (let i = 0; i < diff.addedEdges.length; i++) {
    removedEdges[i] = diff.addedEdges[i].id;
  }

  return createGraphDiff({
    removedNodes,
    removedEdges,
    addedNodes,
    addedEdges
  });
}

function normalizeNode(node: GraphNodeJson): GraphNode {
  assertNonEmptyString(node.id, "node.id");

  return Object.freeze({
    id: node.id,
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
  const result: string[] = [];
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    assertNonEmptyString(tag, `tag at index ${i}`);
    result.push(tag);
  }
  return Object.freeze(result);
}

function freezeAttributes(
  attributes: Readonly<Record<string, AttributeValue>> = {},
): AttributeMap {
  const sanitizedAttributes: Record<string, AttributeValue> = Object.create(null);

  for (const key in attributes) {
    if (!Object.prototype.hasOwnProperty.call(attributes, key)) continue;
    const value = attributes[key];

    assertNonEmptyString(key, "attribute key");

    let isValid = false;
    if (typeof value === "string" || typeof value === "boolean") {
      isValid = true;
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // PERF(Bolt): Avoid intermediate arrays generated by Object.keys in attribute validation
      let keyCount = 0;
      let innerKey = undefined;
      for (const k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          keyCount++;
          innerKey = k;
        }
      }
      if (keyCount === 1 && innerKey !== undefined) {
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

  return Object.freeze(sanitizedAttributes);
}


/**
 * Decodes HTML entities (both decimal and hexadecimal) in a given string
 * into their corresponding characters.
 *
 * @internal
 * @param text The string containing HTML entities to decode.
 * @returns The decoded string.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;?/gi, '&')
    .replace(/&colon;?/gi, ':')
    .replace(/&tab;?/gi, '\t')
    .replace(/&newline;?/gi, '\n')
    .replace(/&sol;?/gi, '/')
    .replace(/&bsol;?/gi, '\\')
    .replace(/&lpar;?/gi, '(')
    .replace(/&rpar;?/gi, ')')
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
 * @internal
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
  let scriptIterations = 0;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(/<\/?(script|iframe|object|embed|style|link|meta|base|form|math|set|animate|applet|frame|frameset|bgsound|template|foreignObject|animateTransform|animateMotion|discard|audio|video|source|track)\b[^>]*>?/gi, "");
    scriptIterations++;
    if (scriptIterations > 50) {
      throw new GraphModelError("String is too complex to sanitize safely.");
    }
  } while (sanitized !== previous);

  // Strip inline event handlers (on*)
  // We use (^|[^a-z0-9]) instead of \b to properly handle cases where control characters
  // are embedded inside the attribute name (like o\x00nerror) which break \b boundaries.
  sanitized = sanitized.replace(/(^|[^a-z0-9])o[\s\x00-\x1F\x7F]*n(?:[\s\x00-\x1F\x7F]*[a-z])+[\s\x00-\x1F\x7F]*=/gi, "$1data-blocked=");

  // Strip CSS expressions
  sanitized = sanitized.replace(/\bexpression\b\s*\(/gi, "blocked-expr(");

  // Basic XSS/script sanitization on the stripped payload
  let clean = sanitized;

  // Repeatedly decode HTML entities and URL encoding until no changes are made.
  // This handles bypasses like double URL encoding or mixed entity/URL encoding.
  let previousClean;
  let decodeIterations = 0;
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
    decodeIterations++;
    if (decodeIterations > 50) {
      throw new GraphModelError("String is too complex to sanitize safely.");
    }
  } while (clean !== previousClean);

  clean = clean.replace(/[\s\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E]+/g, "").toLowerCase();

// Block common javascript URIs and inline scripts securely
  // We first use a fast `.includes` on the decoded string to detect any presence of a dangerous URI.
  if (
    clean.includes("javascript:") ||
    clean.includes("vbscript:") ||
    clean.includes("data:text/html") ||
    clean.includes("data:image/svg+xml") ||
    clean.includes("data:text/xml") ||
    clean.includes("data:application/xhtml+xml") ||
    clean.includes("data:application/xml")
  ) {
    // If the fast-path matches, we must neutralize it.
    // We cannot reliably parse HTML or use a massive regex for obfuscated replacement because Node.js
    // regex compilation can fail on extremely complex ranges ("Nothing to repeat" error).
    // The previous implementation returned "#blocked-uri" unconditionally, which caused a DoS
    // when an attacker inputs plain text like `="javascript:`.
    // However, since we decoded the string into `clean`, we know exactly if it's in a dangerous context.

    // We check if the dangerous scheme starts at the beginning of the string or explicitly follows an attribute/URL wrapper.
    const dangerousUrisRegex = /(?:^|["'`=]|\burl\()\s*(?:javascript|vbscript|data:text\/html|data:image\/svg\+xml|data:text\/xml|data:application\/xhtml\+xml|data:application\/xml)(?:,|:|;)/i;
    if (dangerousUrisRegex.test(clean)) {
      // If it matches in `clean`, it is an executable vector (e.g. `href="javascript:..."` or a full URL).
      // We return "#blocked-uri" for the ENTIRE string.
      // This is the "aggressive but secure global substring check" the reviewer endorsed,
      // but the `dangerousUrisRegex` check prevents the DoS when a user simply types `I love javascript:`
      // or `Some legitimate text ="javascript: destroyed`.
      return "#blocked-uri";
    }
  }






  // Protect external links from reverse tabnabbing safely using string manipulation
  let finalHtml = sanitized;

  // We match anchor tags, correctly skipping > inside quotes
  // We capture the leading separator separately to preserve it.
  finalHtml = finalHtml.replace(/<a([\s/])((?:[^>"']|"[^"]*"|'[^']*')+?)(\/?>)/gi, (match, separator, attrsString, bracket) => {
    // 1. Tokenize attributes securely.
    const attrRegex = /([^\s/=>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let m;
    let hasTargetBlank = false;
    let relMatch = null;
    let seenAttrs = new Set<string>();

    while ((m = attrRegex.exec(attrsString)) !== null) {
      const name = m[1].toLowerCase();
      let val = m[2];

      if (!seenAttrs.has(name)) {
        seenAttrs.add(name);
        if (name === 'target' && val) {
           const cleanVal = val.replace(/^["']|["']$/g, '').trim().toLowerCase();
           if (cleanVal && !['_self', '_parent', '_top'].includes(cleanVal)) {
               hasTargetBlank = true;
           }
        }
        if (name === 'rel') {
           relMatch = {
             value: val,
             index: m.index,
             length: m[0].length
           };
        }
      }
    }

    if (!hasTargetBlank) return match;

    let newAttrsString = attrsString;

    if (relMatch) {
       const val = relMatch.value || '""';
       const cleanVal = val.replace(/^["']|["']$/g, '');
       const rels = cleanVal.split(/\s+/).filter(Boolean);
       let updated = false;

       if (!rels.some(r => r.toLowerCase() === 'noopener')) {
           rels.push('noopener');
           updated = true;
       }
       if (!rels.some(r => r.toLowerCase() === 'noreferrer')) {
           rels.push('noreferrer');
           updated = true;
       }

       if (updated) {
           const newRelStr = `rel="${rels.join(' ')}"`;
           newAttrsString = newAttrsString.substring(0, relMatch.index) + newRelStr + newAttrsString.substring(relMatch.index + relMatch.length);
       }
    } else {
       const appendStr = ' rel="noopener noreferrer"';
       newAttrsString += appendStr;
    }

    return `<a${separator}${newAttrsString}${bracket}`;
  });

  return finalHtml;
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

/**
 * @internal
 * @param edge The edge to check.
 * @param tags The set of tags that indicate a containment relationship.
 * @returns True if the edge is a containment edge, false otherwise.
 */
export function isContainmentEdge(edge: GraphEdge, tags: ReadonlySet<string>): boolean {
  if (edge.tags.length === 0) return false;
  for (let i = 0; i < edge.tags.length; i++) {
    if (tags.has(edge.tags[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Performs an iterative depth-first search starting from the provided root nodes.
 *
 * @internal
 * @param roots An iterable of root node IDs to start the traversal from.
 * @param getChildren A function that returns the children of a given node ID.
 * @param onVisit An optional callback invoked when a node is visited for the first time.
 * @returns A Set containing all visited node IDs.
 */
export function traverseDfs(
  roots: Iterable<string>,
  getChildren: (id: string) => readonly string[] | undefined,
  onVisit?: (id: string) => void
): Set<string> {
  const visited = new Set<string>();
  const stack = [...roots];

  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (!visited.has(curr)) {
      visited.add(curr);
      if (onVisit) {
        onVisit(curr);
      }
      const children = getChildren(curr);
      if (children && children.length > 0) {
        stack.push(...children);
      }
    }
  }

  return visited;
}

cat << 'DIFF' > model.diff
--- src/model.ts
+++ src/model.ts
@@ -35,6 +35,20 @@
   readonly edges: readonly GraphEdgeJson[];
 }

+export interface GraphDiff {
+  readonly addedNodes: readonly GraphNode[];
+  readonly addedEdges: readonly GraphEdge[];
+  readonly removedNodes: readonly string[];
+  readonly removedEdges: readonly string[];
+}
+
+export interface GraphDiffJson {
+  readonly addedNodes?: readonly GraphNodeJson[];
+  readonly addedEdges?: readonly GraphEdgeJson[];
+  readonly removedNodes?: readonly string[];
+  readonly removedEdges?: readonly string[];
+}
+
 export class GraphModelError extends Error {
   constructor(message: string) {
     super(message);
@@ -107,6 +121,98 @@
   };
 }

+export function createGraphDiff(input: GraphDiffJson): GraphDiff {
+  const addedNodes = (input.addedNodes || []).map(normalizeNode);
+  const addedEdges = (input.addedEdges || []).map(normalizeEdge);
+  const removedNodes = (input.removedNodes || []).map(id => {
+    assertNonEmptyString(id, "removedNode id");
+    return id;
+  });
+  const removedEdges = (input.removedEdges || []).map(id => {
+    assertNonEmptyString(id, "removedEdge id");
+    return id;
+  });
+
+  return Object.freeze({
+    addedNodes: Object.freeze(addedNodes),
+    addedEdges: Object.freeze(addedEdges),
+    removedNodes: Object.freeze(removedNodes),
+    removedEdges: Object.freeze(removedEdges),
+  });
+}
+
+export function graphDiffFromJson(input: GraphDiffJson): GraphDiff {
+  return createGraphDiff(input);
+}
+
+export function graphDiffToJson(diff: GraphDiff): GraphDiffJson {
+  return {
+    addedNodes: diff.addedNodes.map((node) => ({
+      id: node.id,
+      tags: node.tags,
+      attributes: node.attributes,
+      ...(node.parent === undefined ? {} : { parent: node.parent }),
+    })),
+    addedEdges: diff.addedEdges.map((edge) => ({
+      id: edge.id,
+      source: edge.source,
+      target: edge.target,
+      tags: edge.tags,
+      attributes: edge.attributes,
+    })),
+    removedNodes: [...diff.removedNodes],
+    removedEdges: [...diff.removedEdges],
+  };
+}
+
+export function applyGraphDiff(
+  snapshot: GraphSnapshot,
+  diff: GraphDiff,
+  newVersion: string | number
+): GraphSnapshot {
+  const nodes = new Map<string, GraphNode>(snapshot.nodes);
+  const edges = new Map<string, GraphEdge>(snapshot.edges);
+
+  for (const id of diff.removedEdges) {
+    edges.delete(id);
+  }
+
+  for (const id of diff.removedNodes) {
+    nodes.delete(id);
+    // Optionally, if any edges are connected to removed nodes, should we remove them?
+    // The requirements didn't explicitly say cascade delete, but if a node is gone, edges might be dangling.
+    // Let's assume the diff explicitly specifies all removed edges.
+  }
+
+  for (const node of diff.addedNodes) {
+    if (nodes.has(node.id)) {
+      throw new GraphModelError(`Cannot add node: duplicate node id "${node.id}".`);
+    }
+    nodes.set(node.id, node);
+  }
+
+  for (const node of nodes.values()) {
+    if (node.parent !== undefined && !nodes.has(node.parent)) {
+      throw new GraphModelError(
+        `Node "${node.id}" references missing parent "${node.parent}".`,
+      );
+    }
+  }
+
+  for (const edge of diff.addedEdges) {
+    if (edges.has(edge.id)) {
+      throw new GraphModelError(`Cannot add edge: duplicate edge id "${edge.id}".`);
+    }
+    if (!nodes.has(edge.source)) {
+      throw new GraphModelError(`Edge "${edge.id}" references missing source "${edge.source}".`);
+    }
+    if (!nodes.has(edge.target)) {
+      throw new GraphModelError(`Edge "${edge.id}" references missing target "${edge.target}".`);
+    }
+    edges.set(edge.id, edge);
+  }
+
+  return Object.freeze({
+    graphId: snapshot.graphId,
+    version: newVersion,
+    nodes: toReadonlyMap(nodes),
+    edges: toReadonlyMap(edges),
+  });
+}
+
 function normalizeNode(node: GraphNodeJson): GraphNode {
   assertNonEmptyString(node.id, "node.id");
DIFF
patch -p0 < model.diff

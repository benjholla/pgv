/**
 * @packageDocumentation
 * Frontend-only graph visualization primitives for immutable attributed program-analysis graphs.
 * @module @pgv/graph-core
 */
export type {
  AttributeMap,
  AttributeValue,
  GraphEdge,
  GraphEdgeJson,
  GraphNode,
  GraphNodeJson,
  GraphSchema,
  GraphSchemaJson,
  GraphSnapshot,
  GraphSnapshotJson,
} from "./model";
export type {
  GraphDiff,
  GraphDiffJson,
} from "./model";
export {
  GraphModelError,
  createGraphSnapshot,
  graphSnapshotToJson,
  createGraphDiff,
  graphDiffToJson,
  applyGraphDiff,
  decodeHtmlEntities,
  sanitizeString,
} from "./model";
export type {
  EdgeRoutingHint,
  LayoutSnapshot,
  Point,
  Size,
  VerticalLayoutOptions,
} from "./layout";
export type { EdgeEndpointsResult } from "./layout";
export { edgeEndpoints, verticalLayout } from "./layout";
export type { GraphViewOptions, SelectionState } from "./renderer";
export { GraphView, tagToClassName } from "./renderer";

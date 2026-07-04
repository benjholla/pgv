/**
 * Frontend-only graph visualization primitives for immutable attributed program-analysis graphs.
 * @module @pgv/graph-core
 */
export type {
  AttributeMap,
  AttributeValue,
  Graph,
  GraphEdge,
  GraphEdgeJson,
  GraphNode,
  GraphNodeJson,
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
  LayoutSnapshot,
  Point,
  Size,
  VerticalLayoutOptions,
} from "./layout";
export type { EdgeEndpointsResult } from "./layout";
export { edgeEndpoints, verticalLayout } from "./layout";
export type { GraphViewOptions, SelectionState } from "./renderer";
export { GraphView, renderGraph, tagToClassName } from "./renderer";

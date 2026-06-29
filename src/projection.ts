import type { GraphSnapshot } from "./model";

/**
 * A function that transforms one `GraphSnapshot` into another.
 *
 * Projections are used to create derived views of a graph, such as filtering
 * out certain nodes, collapsing compound structures, or mapping complex semantics
 * into a simpler visual representation without altering the original data.
 */
export type GraphProjection = (graph: GraphSnapshot) => GraphSnapshot;

/**
 * A default projection that returns the graph unchanged.
 * Useful as a baseline or fallback when no projection logic is needed.
 */
export const identityProjection: GraphProjection = (graph) => graph;

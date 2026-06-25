import type { GraphSnapshot } from "./model";

export type GraphProjection = (graph: GraphSnapshot) => GraphSnapshot;

export const identityProjection: GraphProjection = (graph) => graph;

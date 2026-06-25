# Project Brief

## Vision

Build a frontend-only graph visualization and interaction library for immutable
attributed graphs produced by external systems.

Initial graph families:

- Control Flow Graphs (CFGs)
- Dominator Trees
- Program Dependence Graphs (PDGs)
- Program Slices
- Call Graphs
- Other program-analysis visualizations

The library is not a graph database and does not perform graph analysis. It is
responsible for rendering, layout, interaction, projection, and visualization.

## Core Principles

- Graphs are immutable snapshots.
- Updates are represented as a new `GraphSnapshot` or an optional `GraphDiff`
  that produces a new immutable snapshot.
- The renderer never mutates graph objects.
- Producer-assigned node and edge IDs are sacred.
- Identity is determined solely by ID.
- If attributes or tags change but the ID remains the same, the renderer should
  treat it as the same node or edge and preserve ID-keyed state.
- Frontend owns layout. Backends provide graph semantics only.
- Graph, layout, view state, and renderer state stay separate.

## Graph Model

```ts
type AttributeValue = string | number | boolean | bigint | null;

interface GraphElement {
  readonly id: string;
  readonly tags: readonly string[];
  readonly attributes: Readonly<Record<string, AttributeValue>>;
}

interface GraphNode extends GraphElement {
  readonly parent?: string;
}

interface GraphEdge extends GraphElement {
  readonly source: string;
  readonly target: string;
}

interface Graph {
  readonly nodes: ReadonlyMap<string, GraphNode>;
  readonly edges: ReadonlyMap<string, GraphEdge>;
}
```

Nodes support future compound/nested graph rendering through `parent`.

## Pipeline

```text
Graph
  -> Projection
  -> Projected Graph
  -> Layout
  -> Renderer
```

Milestone 1 pipeline:

```text
JSON -> Graph -> Layout -> Render
```

## Rendering Strategy

- HTML nodes.
- SVG edges.
- No Canvas/WebGL for the initial design.
- Tags become CSS classes such as `tag-entry`, `tag-back-edge`, and
  `tag-true-branch`.

## Future Features

- Selection state and click events.
- Smart View / context projection.
- Incremental rendering.
- Pan and zoom.
- Node dragging and pinned positions.
- Minimap.
- Animations.
- Vue, VSCode, and Jupyter adapters.

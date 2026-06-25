# Graph Visualization Library Design Summary

## Vision

Build a **frontend-only graph visualization and interaction library** for displaying immutable attributed graphs produced by external systems (initially Java, later Python, VSCode, notebooks, etc.).

The library is focused on:

* Control Flow Graphs (CFGs)
* Dominator Trees
* Program Dependence Graphs (PDGs)
* Program Slices
* Call Graphs
* Other program-analysis visualizations

The library is **not** a graph database and **not** responsible for graph analysis.

It is responsible for:

* Rendering
* Layout
* Interaction
* Projection
* Visualization

## License

The goal of this effort is to create a library releasable under the MIT License.

---

# Core Architectural Principles

## Immutable Graphs

Graphs are immutable snapshots.

```typescript
GraphSnapshot
```

contains a complete graph state.

Updates are represented as:

```typescript
GraphSnapshot V1
→
GraphSnapshot V2
```

or optionally:

```typescript
GraphDiff
```

that produces a new immutable graph.

The renderer never mutates graph objects.

---

## Identity Is Sacred

The producer assigns:

```text
Unique Node IDs
Unique Edge IDs
```

that remain unique for the lifetime of the producer process.

Identity is determined solely by ID.

If attributes/tags change but ID remains the same:

```text
Same node
```

Renderer should preserve:

* layout
* selection
* hover state
* search results
* annotations
* animations

based on IDs.

---

# Graph Model

## Attribute Value

```typescript
type AttributeValue =
    string |
    number |
    boolean |
    bigint |
    null;
```

## GraphElement

```typescript
interface GraphElement {

    readonly id: string;

    readonly tags: readonly string[];

    readonly attributes:
        Readonly<Record<string, AttributeValue>>;
}
```

## GraphNode

```typescript
interface GraphNode
    extends GraphElement {

    readonly parent?: string;
}
```

Supports compound/nested nodes via containment.

---

## GraphEdge

```typescript
interface GraphEdge
    extends GraphElement {

    readonly source: string;

    readonly target: string;
}
```

Edges have tags and attributes just like nodes.

Examples:

```text
back-edge
true-branch
false-branch
exception
control-dependence
data-dependence
```

---

## Graph

```typescript
interface Graph {

    readonly nodes:
        ReadonlyMap<string, GraphNode>;

    readonly edges:
        ReadonlyMap<string, GraphEdge>;
}
```

---

# Frontend Owns Layout

Important decision:

**All layout is computed in the frontend.**

Backend provides only graph semantics.

No coordinates.

No visual state.

No rendering information.

---

# Separation of Concerns

## Graph

Immutable semantic data.

Contains:

* nodes
* edges
* tags
* attributes

Contains no:

* coordinates
* selection
* search
* filters
* collapse state

---

## Layout

```typescript
LayoutSnapshot
```

Stores node positions.

Separate from graph.

```typescript
interface LayoutSnapshot {

    positions:
        ReadonlyMap<string, Point>;
}
```

---

## View State

Contains UI state.

Examples:

```typescript
SelectionState
SearchState
FilterState
```

Should be immutable.

Should be keyed by node/edge IDs.

---

# Projection Pipeline

Major design decision.

Most user interactions are actually graph projections.

Architecture:

```text
Graph
    ↓
Projection
    ↓
Projected Graph
    ↓
Layout
    ↓
Renderer
```

---

## Smart View

First built-in projection.

Purpose:

Given selected nodes:

```text
Reverse Context Depth
Forward Context Depth
```

show neighborhood around selected node.

Example:

```text
Selected: B

Reverse = 1
Forward = 2
```

Projection includes:

```text
predecessors within 1 step
successors within 2 steps
```

Buttons can increase/decrease depths dynamically.

Projection recomputes.

Layout recomputes.

Renderer updates.

No graph mutation.

---

## Future Projections

Potential built-ins:

```text
ContextProjection
SliceProjection
TagProjection
FunctionProjection
CollapseProjection
SearchProjection
```

---

# Rendering Strategy

Decision:

```text
HTML Nodes
+
SVG Edges
```

Not Canvas.

Not WebGL.

Reasons:

* Easier debugging
* Easier CSS styling
* Rich node content
* Program-analysis nodes often contain text/code

---

# Styling

Tags automatically become CSS classes.

Example:

```typescript
tags = [
    "entry",
    "selected"
]
```

becomes:

```html
<div class="
    graph-node
    tag-entry
    tag-selected">
```

CSS:

```css
.tag-entry {
    background: green;
}
```

---

# Compound Nodes

Nodes support:

```typescript
parent?: string
```

for hierarchical containment.

Future:

* expand
* collapse
* region grouping

---

# Future Features

These should NOT modify the graph model.

## Search

Search state stored separately.

Results rendered as overlays/highlights.

---

## Filtering

Filtering is a projection.

---

## Highlights

Overlay/layer system.

Examples:

```text
Program Slice
Dominator Path
Coverage
Profiling
```

---

## Minimap

Separate rendering layer.

---

## Animations

Renderer-owned.

Based on graph/layout diffs.

---

# Layer Architecture

Future renderer architecture:

```text
Edge Layer
Node Layer
Selection Layer
Highlight Layer
Search Layer
Tooltip Layer
Minimap Layer
```

Layers should be pluggable.

---

# Backend Philosophy

Backend is a graph producer.

Examples:

```text
Java
Python
LSP
VSCode Extension Host
REST API
WebSocket
```

Backend emits graph snapshots.

Renderer consumes graph snapshots.

Renderer never depends on backend technology.

---

# Canonical Transport Format

JSON.

Example:

```json
{
  "graphId": "cfg-main",
  "version": 42,
  "nodes": [...],
  "edges": [...]
}
```

No coordinates.

No layout.

No view state.

---

# Repository Structure

Recommended:

```text
graph-core/
graph-vue/
graph-vscode/
graph-jupyter/
```

---

## graph-core

Contains:

```text
model
projection
layout
renderer
interaction
theme
```

Only repository containing rendering logic.

Published as:

```text
@yourorg/graph-core
```

---

## graph-vue

Thin Vue wrapper.

Provides:

```vue
<GraphView />
```

around graph-core.

---

## graph-vscode

VSCode WebView adapter.

Receives graph snapshots.

Uses graph-core renderer.

---

## graph-jupyter

Notebook MIME renderer.

Receives graph snapshots.

Uses graph-core renderer.

---

# Example Integrations

## Vue

Thin wrapper around:

```typescript
GraphView
```

No renderer logic.

---

## VSCode

Architecture:

```text
Extension Host
    ↓
Graph JSON
    ↓
WebView
    ↓
GraphView
```

---

## Jupyter

Architecture:

```text
Python/Java Kernel
    ↓
MIME Bundle
    ↓
Frontend Renderer
```

Graph object implements notebook display protocol.

Frontend uses graph-core.

---

# Milestones

## Milestone 1

Static rendering.

Features:

* Immutable graph snapshot
* Spring Boot backend example
* Vite TypeScript frontend
* Vertical layout
* HTML nodes
* SVG edges

Goal:

```text
JSON
    ↓
Graph
    ↓
Layout
    ↓
Render
```

---

## Milestone 2

Selection.

Features:

* node click events
* edge click events
* selected styling

---

## Milestone 3

Smart View.

Features:

* ContextProjection
* forward depth
* reverse depth
* expand/collapse buttons

---

## Milestone 4

Incremental rendering.

Render only changed nodes/edges.

---

## Milestone 5 (Completed)

Pan and Zoom.

---

## Milestone 6

Node Dragging.

Features:

* drag nodes
* layout constraints
* pinned positions

---

## Milestone 7

Minimap.

---

## Milestone 8

Animations.

Features:

* graph transitions
* projection transitions
* layout transitions

---

## Milestone 9

Vue adapter repository.

---

## Milestone 10

VSCode adapter repository.

---

## Milestone 11

Jupyter adapter repository.

---

# Final Architecture

```text
Graph Producer
(Java/Python/etc)

          ↓

Immutable Graph Snapshot

          ↓

Projection Pipeline

          ↓

Layout Engine
(frontend owned)

          ↓

Render Pipeline

          ↓

Layers
    - Nodes
    - Edges
    - Selection
    - Search
    - Highlights
    - Tooltips
    - Minimap

          ↓

Host Adapters
    - Vue
    - VSCode
    - Jupyter
    - Plain HTML
```

The most important design decisions reached were:

1. Immutable graph snapshots.
2. Stable producer-assigned node/edge IDs.
3. Frontend-owned layout.
4. Projection pipeline (especially Smart View).
5. HTML nodes + SVG edges rendering.
6. Separation of Graph, Layout, View State, and Renderer.
7. graph-core as the only repository containing visualization logic.

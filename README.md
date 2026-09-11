# @pgv/graph-core

[![CI](https://github.com/benjholla/pgv/actions/workflows/ci.yml/badge.svg)](https://github.com/benjholla/pgv/actions/workflows/ci.yml)

## What is this?
**@pgv/graph-core** is an embeddable, interactive frontend library designed to visualize immutable, attributed, compound graphs. It acts as a high-performance presentation layer, completely decoupling logical graph models from geometric layouts and DOM/SVG rendering.

While the core models are graph-agnostic, the layout and rendering heuristics are tuned specifically for the complex topological structures commonly found in program-analysis (e.g., control-flow graphs, call graphs, execution traces).

This repository represents the `graph-core` package. It owns the mathematical graph models, the geometric layout calculations, and the hybrid HTML/SVG renderer. Host integrations—whether a VSCode extension, Jupyter Notebook widget, Vue app, or static blog—are intended to be extremely thin layers that simply pipe data into this library.

## Why does it exist?
This project exists to bridge the gap between heavy, sophisticated graph analysis backends and rich frontend visualization.

By representing graphs as strictly immutable snapshots, and explicitly separating layout mathematics from visualization logic, `@pgv/graph-core` guarantees:
- **Topological Determinism:** Rendering the exact same graph data always produces the exact same layout, preserving the user's mental map.
- **Portability:** Agnostic of the transport layer (WebSockets, `postMessage`, HTTP).
- **Extensibility:** Features like incremental rendering, time-travel historical diffs, and context projections become dramatically simpler to build when the graph state cannot be mutated out from under them.

It intentionally delegates heavy algorithmic graph analysis to backends, acting strictly as a high-performance presentation workspace where users can navigate, pan, zoom, search, and visually compare snapshots.

## Architecture Overview
The architecture is designed as a strict, unidirectional pipeline:

```mermaid
flowchart LR
    JSON[JSON Data] --> Snapshot[Graph Snapshot]
    Snapshot --> Projection[Projection]
    Projection --> Layout[Layout]
    Layout --> Render[View Rendering]
```
- **Graph Snapshot**: Immutable storage of nodes and edges (pure data).
- **Projection**: Derives alternate views (e.g., hiding subsets of nodes).
- **Layout**: Assigns geometry without altering graph logic.
- **View Rendering**: Interprets layout geometry and graph data into DOM nodes and SVG, managing its own transient view state (like pan/zoom/selection).

## Public APIs

The `@pgv/graph-core` package exposes several core models:

- `GraphSnapshot`: An immutable snapshot of a graph (nodes and edges).
- `LayoutSnapshot`: An immutable snapshot of computed layout geometry.
- `GraphView`: The primary class used to render and interact with a `GraphSnapshot`.
- `GraphDiff`: Represents an incremental change (additions and removals) between two graph states.

For full details, generate the TypeDoc API reference via `pnpm run docs` or explore the exported definitions in `src/index.ts`.

## Quick Start

### Install

```bash
pnpm install @pgv/graph-core
```

### Basic Usage

```ts
import {
  createGraphSnapshot,
  GraphView,
  verticalLayout,
  type GraphSnapshotJson,
} from "@pgv/graph-core";
import "@pgv/graph-core/style.css";

// 1. Create an immutable graph snapshot from backend JSON data
const graph = createGraphSnapshot(json as GraphSnapshotJson);

// 2. Compute a layout snapshot for the graph
const layout = verticalLayout(graph);

// 3. Initialize the interactive graph view
const view = new GraphView(document.querySelector("#graph")!, schema, {
  layout,
  usePanZoom: true,
  useThemeToggle: true,
  theme: "auto", // or "light", "dark"
});

// 4. Render the graph
view.setGraph(graph);
```

<details>
<summary><b>Contributing & Development</b></summary>

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development environment setup, and the process for submitting pull requests to us.

## Development & Examples

| Command | Description |
| :--- | :--- |
| `pnpm run docs` | Generate the full HTML API documentation (using TypeDoc) in `docs/` |
| `pnpm run dev:static` | Run the static Vite frontend demo |
| `pnpm run dev:blog` | Run the static Vite blog frontend demo |
| `pnpm run dev:static-history` | Run the static history diff demo |
| `pnpm run dev:backend &` | Run the Spring Boot graph producer example (or use `mvn -f examples/spring-boot-producer/pom.xml spring-boot:run`) |
| `pnpm run dev:dynamic &` | Run the Dynamic Vite demo (requires backend to be running) |

After starting the backend, fetch from: `http://localhost:8080/api/graphs/cfg-main`

</details>

<details>
<summary><b>Features</b></summary>

- **Pan and Zoom**: Interactive exploration with mouse or touch.
- **Theming**: Built-in support for light, dark, and system themes.
- **Customizable**: Control layers for zooming, panning, and theme toggling.
- **Graph History**: Navigate backwards and forwards through snapshots via GraphDiffs.
</details>

<details>
<summary><b>Project Layout</b></summary>

```text
src/
  model.ts        Immutable graph and JSON transport types
  layout.ts       Frontend-owned vertical layout
  renderer.ts     HTML nodes + SVG edges renderer
  style.css       Base graph visualization theme

examples/
  vite-blog/                Static blog post frontend demo
  vite-static/              Static TypeScript frontend demo
  vite-static-history/      Static demo showcasing graph diff history navigation
  vite-dynamic/             Dynamic demo fetching from backend
  spring-boot-producer/     Backend JSON producer demo

```
</details>

## Package Notes

The package is configured for ESM publishing with generated TypeScript declarations. The current package name is `@pgv/graph-core`; update the scope before publishing if your npm organization uses a different name.

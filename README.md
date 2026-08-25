# @pgv/graph-core

[![CI](https://github.com/benjholla/pgv/actions/workflows/ci.yml/badge.svg)](https://github.com/benjholla/pgv/actions/workflows/ci.yml)

## What is this?
Frontend-only graph visualization primitives for immutable attributed program-analysis graphs.

This repository is the `graph-core` package described in the design notes. It owns the graph model, frontend layout, and HTML/SVG renderer. Host integrations such as Vue, VSCode, and Jupyter should stay thin and reuse this package.

## Why does it exist?
This project is designed to bridge the gap between complex external program-analysis systems and frontend visualization. By representing graphs as immutable snapshots and explicitly decoupling layout from logic, `@pgv/graph-core` guarantees stable, predictable rendering while making features like incremental rendering, historical diffs, and context projections dramatically simpler to build. It intentionally delegates heavy graph analysis to backends, acting strictly as a high-performance presentation layer.

## What problems does it solve?
- **Decoupled Architecture**: Layout and rendering are entirely separate from graph logic, ensuring maximum portability.
- **Predictable Determinism**: Layouts are mathematically consistent and structurally deterministic, preserving the user's mental map between states.
- **Immutable State Handling**: Supports robust time-travel interactions via incremental delta streams (`GraphDiff`s) without expensive full-graph recalculations.
- **High-Performance Presentation**: Handles massive, dynamic control-flow and dependency graphs through an optimized, orthogonal routing pipeline and SVG/DOM hybrid rendering.
- **Host-Agnostic Setup**: Operates without a tied transport layer, easily embedding into VSCode WebViews, Jupyter Notebooks, or static web applications.

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
  type GraphSchemaJson
} from "@pgv/graph-core";
import "@pgv/graph-core/style.css";

// 1. Fetch or provide your JSON graph data and schema
const json = {
  nodes: [{ id: 1, properties: { "XCSG.name": "Entry" } }],
  edges: []
} as GraphSnapshotJson;

const schema = {
  tags: { "XCSG.ControlFlow_Node": { color: "#3b82f6" } }
} as GraphSchemaJson;

// 2. Create an immutable graph snapshot from JSON data
const graph = createGraphSnapshot(json);

// 3. Compute a geometric layout snapshot for the graph
const layout = verticalLayout(graph);

// 4. Initialize the interactive renderer
const container = document.querySelector("#graph") as HTMLElement;
const view = new GraphView(container, schema, {
  layout,
  usePanZoom: true,
  useThemeToggle: true,
  theme: "auto", // Supports "light", "dark", or "auto"
});

// 5. Mount the graph snapshot to the view
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

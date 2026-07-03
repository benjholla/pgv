# @pgv/graph-core

## What is this?
Frontend-only graph visualization primitives for immutable attributed program-analysis graphs.

This repository is the `graph-core` package described in the design notes. It owns the graph model, frontend layout, and HTML/SVG renderer. Host integrations such as Vue, VSCode, and Jupyter should stay thin and reuse this package.

## Why does it exist?
This project is designed to bridge the gap between complex external program-analysis systems and frontend visualization. By representing graphs as immutable snapshots and explicitly decoupling layout from logic, `@pgv/graph-core` guarantees stable, predictable rendering while making features like incremental rendering, historical diffs, and context projections dramatically simpler to build. It intentionally delegates heavy graph analysis to backends, acting strictly as a high-performance presentation layer.

## Architecture Overview
The architecture is designed as a strict, unidirectional pipeline:

```text
JSON Data -> Graph Snapshot -> Projection -> Layout -> View Rendering
```
- **Graph Snapshot**: Immutable storage of nodes and edges (pure data).
- **Projection**: Derives alternate views (e.g., hiding subsets of nodes).
- **Layout**: Assigns geometry without altering graph logic.
- **View Rendering**: Interprets layout geometry and graph data into DOM nodes and SVG, managing its own transient view state (like pan/zoom/selection).

## Quick Start

### Install

```bash
npm install @pgv/graph-core
```

### Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development environment setup, and the process for submitting pull requests to us.

### Basic Usage

```ts
import {
  createGraphSnapshot,
  renderGraph,
  verticalLayout,
  type GraphSnapshotJson,
} from "@pgv/graph-core";
import "@pgv/graph-core/style.css";

const graph = createGraphSnapshot(json as GraphSnapshotJson);
const layout = verticalLayout(graph);

renderGraph(document.querySelector("#graph")!, graph, {
  layout,
  usePanZoom: true,
  useThemeToggle: true,
  theme: "auto", // or "light", "dark"
});
```

## Documentation

To generate the full HTML API documentation (using TypeDoc), run:

```bash
npm install
npm run docs
```

The output will be placed in the `docs/` directory. Open `docs/index.html` in your browser.

## Examples

Run the static Vite example:
```bash
npm run dev:static
```

Run the Spring Boot graph producer example:
```bash
npm run dev:backend &
```

Then fetch from:
`http://localhost:8080/api/graphs/cfg-main`

The equivalent direct Maven command is:
```bash
mvn -f examples/spring-boot-producer/pom.xml spring-boot:run
```

To run the Dynamic Vite example, ensure the Spring Boot graph producer is running, then run:
```bash
npm run dev:dynamic &
```

## Features

- **Pan and Zoom**: Interactive exploration with mouse or touch.
- **Theming**: Built-in support for light, dark, and system themes.
- **Customizable**: Control layers for zooming, panning, and theme toggling.
- **Graph History**: Navigate backwards and forwards through snapshots via GraphDiffs.

## Project Layout

```text
src/
  model.ts        Immutable graph and JSON transport types
  layout.ts       Frontend-owned vertical layout
  renderer.ts     HTML nodes + SVG edges renderer
  style.css       Base graph visualization theme

examples/
  vite-static/              Static TypeScript frontend demo
  vite-dynamic/             Dynamic demo fetching from backend
  spring-boot-producer/     Backend JSON producer demo
```

## Package Notes

The package is configured for ESM publishing with generated TypeScript declarations. The current package name is `@pgv/graph-core`; update the scope before publishing if your npm organization uses a different name.

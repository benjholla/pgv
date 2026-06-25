# @pgv/graph-core

Frontend-only graph visualization primitives for immutable attributed graphs produced by external program-analysis systems.

This repository is the `graph-core` package described in the design notes. It owns the graph model, projection pipeline entry point, frontend layout, and HTML/SVG renderer. Host integrations such as Vue, VSCode, and Jupyter should stay thin and reuse this package.

## Milestone 1

Implemented:

- Immutable graph snapshot model with stable producer-assigned node and edge IDs.
- JSON transport parser for `{ graphId, version, nodes, edges }`.
- Vertical frontend-owned layout.
- HTML node rendering with SVG edge rendering.
- Tag-to-CSS-class styling, including classes like `graph-node`, `graph-edge`, and `tag-entry`.
- Vite TypeScript static frontend example.
- Spring Boot backend example that emits graph JSON without coordinates or view state.

Pipeline:

```text
JSON -> GraphSnapshot -> Vertical LayoutSnapshot -> HTML/SVG Render
```

## Install

```bash
npm install
```

## Develop

Run the static Vite example:

```bash
npm run dev
```

Build the library:

```bash
npm run build
```

Build the Vite example:

```bash
npm run build:demo
```

Run the Spring Boot graph producer example:

```bash
cd examples/spring-boot-producer
mvn spring-boot:run
```

Then fetch:

```text
http://localhost:8080/api/graphs/cfg-main
```

## Basic Usage

```ts
import {
  graphSnapshotFromJson,
  renderGraph,
  verticalLayout,
  type GraphSnapshotJson,
} from "@pgv/graph-core";
import "@pgv/graph-core/style.css";

const graph = graphSnapshotFromJson(json as GraphSnapshotJson);
const layout = verticalLayout(graph);

renderGraph(document.querySelector("#graph")!, graph, { layout });
```

## Project Layout

```text
src/
  model.ts        Immutable graph and JSON transport types
  layout.ts       Frontend-owned vertical layout
  projection.ts   Projection interface and identity projection
  renderer.ts     HTML nodes + SVG edges renderer
  style.css       Base graph visualization theme

examples/
  vite-static/              Static TypeScript frontend demo
  spring-boot-producer/     Backend JSON producer demo
```

## Package Notes

The package is configured for ESM publishing with generated TypeScript declarations. The current package name is `@pgv/graph-core`; update the scope before publishing if your npm organization uses a different name.

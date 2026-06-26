# Implementation State

## Repository

This is a TypeScript npm package named `@pgv/graph-core`.

## Main Package

Important files:

- `src/model.ts` - immutable graph model, JSON transport types, validation, and
  snapshot creation.
- `src/readonly-map.ts` - runtime read-only map view used by graph and layout
  snapshots.
- `src/layout.ts` - frontend-owned vertical layout and edge endpoint helpers.
- `src/projection.ts` - projection interface plus `identityProjection`.
- `src/renderer.ts` - `GraphView`, `renderGraph`, tag-to-class conversion, HTML
  node rendering, SVG edge rendering.
- `src/style.css` - base graph visualization styles.
- `src/index.ts` - public exports.
- `vite.config.ts` - library build config.
- `package.json` - package metadata and npm scripts.

## Examples

Vite static demo:

```text
examples/vite-static
```

It fetches `public/sample-cfg.json`, converts it with `graphSnapshotFromJson`,
computes `verticalLayout`, and calls `renderGraph`.

Spring Boot producer:

```text
examples/spring-boot-producer
```

It exposes:

```text
GET /api/graphs/cfg-main
```

The backend emits semantic graph JSON only. It does not emit coordinates,
layout, selection, filters, or renderer state.

## Scripts

From the repository root:

```bash
npm run dev
npm run build
npm run build:demo
npm run dev:backend
```

Direct backend command:

```bash
mvn -f examples/spring-boot-producer/pom.xml spring-boot:run
```

Fallback if Maven cannot resolve the plugin prefix:

```bash
mvn -f examples/spring-boot-producer/pom.xml org.springframework.boot:spring-boot-maven-plugin:3.3.5:run
```

## Important Decisions

- CSS is explicit: consumers import `@pgv/graph-core/style.css`.
- Vite is on `^8.1.0` to avoid known Vite/esbuild audit findings from the
  original Vite 5 scaffold.
- The Spring Boot Maven plugin is pinned to `3.3.5`.
- `.gitattributes` should keep repository text files on LF line endings.


# Milestone Progress

## Milestone 1

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

## Milestone 2

- Implemented interactive node and edge selection for the graph visualization library. This includes defining the selection state, handling click events, applying visual feedback via CSS, and updating the demo application to showcase the new functionality. Architectural improvements were made to prevent event listener leaks and optimize rendering performance.

## Milestone 2.1

- Added an example `vite-dynamic` that pulls data from the `spring-boot-producer` backend.

Changes include:
- New directory `examples/vite-dynamic` with `index.html`, `vite.config.ts`, and source files.
- New npm scripts: `dev:dynamic`, `build:dynamic`, and `preview:dynamic`.
- Verified UI functionality and backend connectivity.

## Milestone 5

- Implemented Pan and Zoom functionality.
  - Viewport state management (x, y, scale).
  - Mouse/wheel/touch event handling for interactive navigation.
  - CSS transform-based rendering for the graph stage.
  - Optional control layer with zoom and pan buttons.
- Added custom theming and Light/Dark mode support.
  - CSS variable-based styling system (`--pgv-*`).
  - Support for 'light', 'dark', and 'auto' (system preference) themes.
  - Programmatic theme updates via `setGraph` and `GraphViewOptions`.
  - Built-in theme toggle UI control.
  - `onThemeChange` callback for synchronization with host application styles.

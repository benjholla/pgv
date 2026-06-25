# Implementation State

## Repository

Current project root:

```text
C:\Users\benjh\Documents\pgv
```

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

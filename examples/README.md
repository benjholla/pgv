# PGV Examples

This directory contains executable examples demonstrating how to use `@pgv/graph-core` in various environments.

These examples are annotated with XCSG schema tags and attributes.
For more information, see: [XCSG Compendium Introduction](https://medium.com/ensoft/xcsg-compendium-introduction-a0822cf9f721)

## Available Examples

### 1. Static Vite Frontend (`vite-static`)
A minimal, self-contained frontend demonstrating basic layout and rendering. It imports an in-memory graph snapshot, calculates the geometry, and renders it without requiring a backend.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:static
```

### 2. Static Vite Blog Frontend (`vite-blog`)
Demonstrates how to embed `@pgv/graph-core` as multiple independent, interactive graph instances within a larger document (like a blog post or documentation page), showcasing proper scoping and multiple mount points.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:blog
```

### 3. Static History Demo (`vite-static-history`)
Demonstrates how to use the `GraphDiff` model to navigate forwards and backwards through a sequential history of graph states without re-rendering the entire graph, showcasing the time-travel capability.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:static-history
```

### 4. Dynamic Vite Frontend (`vite-dynamic`)
A frontend that fetches JSON graph data dynamically from a REST API. This example requires the `spring-boot-producer` backend to be running.

**To run:**
Ensure the backend is running first (see below), then from the root of the repository, execute:
```bash
pnpm run dev:dynamic
```

### 5. Spring Boot Backend (`spring-boot-producer`)
A sample Java Spring Boot backend that serves graph snapshots as JSON to be consumed by the dynamic frontend.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:backend
```
Alternatively, navigate to `examples/spring-boot-producer` and run `mvn spring-boot:run`.

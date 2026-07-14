# PGV Examples

This directory contains executable examples demonstrating how to use `@pgv/graph-core` in various environments.

These examples are annotated with XCSG schema tags and attributes.
For more information, see: [XCSG Compendium Introduction](https://medium.com/ensoft/xcsg-compendium-introduction-a0822cf9f721)

## Available Examples

### 1. Static Vite Frontend (`vite-static`)
A minimal, static frontend demonstrating basic layout and rendering using an in-memory graph snapshot. It uses `vite` for fast development.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:static
```

### 2. Static History Demo (`vite-static-history`)
Demonstrates how to use the `GraphDiff` model to navigate through a sequence of graph snapshots, showing additions and removals.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:static-history
```

### 3. Dynamic Vite Frontend (`vite-dynamic`)
A frontend that fetches graph data dynamically from a backend API. To use this, you must first start the `spring-boot-producer`.

**To run:**
Ensure the backend is running first (see below), then from the root of the repository, execute:
```bash
pnpm run dev:dynamic
```

### 4. Spring Boot Backend (`spring-boot-producer`)
A sample Java Spring Boot backend that serves graph snapshots as JSON to be consumed by the dynamic frontend.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:backend
```
Alternatively, navigate to `examples/spring-boot-producer` and run `mvn spring-boot:run`.

### 5. Static Tester (`static-tester`)
A test environment used internally for validating changes and layouts during development.

**To run:**
From the root of the repository, execute:
```bash
pnpm run dev:tester
```

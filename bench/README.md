# Benchmarks

This directory contains Vitest benchmarking scripts for measuring and verifying performance characteristics of the `@pgv/graph-core` package.

These tests validate that our optimizations (such as removing `Array.from()` calls in hot paths, using binary search over `indexOf` for pre-sorted arrays, and performing A* algorithm edge routing optimizations) continue to run quickly on large inputs without regressions.

## Running the benchmarks

To execute the benchmarking suite, ensure you have dependencies installed (`pnpm install`), then run:

```bash
pnpm run bench
```

## Structure

*   `bench-*.bench.ts`: Individual benchmarking files focusing on different subsystems (e.g., array iteration versus `Array.from()`, tree search lookups, object parsing performance, orthogonal edge routing).

When introducing any performance optimization or modifying hot code paths (such as the layout engine or rendering loops), ensure you add or update relevant benchmarks here to quantify the improvements.

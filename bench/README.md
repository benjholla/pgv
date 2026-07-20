# Benchmarks

This directory contains the benchmarking suite for `@pgv/graph-core`.

The benchmarks use [Vitest](https://vitest.dev/) to verify the performance characteristics of hot paths and algorithms within the library.

## Usage

To run the benchmarks, execute the following command from the root directory:

```bash
pnpm run bench
```

## Writing New Benchmarks

When writing new benchmarks:
1. Create a new file in the `bench/` directory, e.g., `my-feature.bench.ts`.
2. Import `bench` and `describe` from `vitest`.
3. Use the `bench` function to define what should be measured.

Example:

```typescript
import { bench, describe } from 'vitest';
// Import code to benchmark

describe('My Feature Performance', () => {
  bench('should execute fast', () => {
    // Code to benchmark
  });
});
```

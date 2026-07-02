## 2026-06-28 - Object Spread Inefficiencies in Hot Loops
**Learning:** Object spread syntax (`...`) inside of mapping functions or hot loops over large collections causes significant performance degradation and memory pressure due to repeated object allocations.
**Action:** Replace conditional spread syntax inside mapping loops with explicit, mutable object initialization and `if` conditional assignments before explicitly casting the return value to the readonly interface.

## 2026-06-29 - O(N^2) Iteration Trap in Depth Assignment
**Learning:** Iterating over graph structures where you recalculate aggregate maximums inside a loop over nodes introduces hidden O(N^2) complexity bottlenecks (e.g. `O(V * E)`).
**Action:** Whenever iterating over nodes to assign layers or depths based on graph connectivity, maintain aggregate properties like `currentMaxDepth` explicitly outside the iterative loop to ensure O(N) linear time calculations.

## 2024-07-01 - Avoid Dynamic RegExp in Hot Search Loops
**Learning:** Iterating over graph structures (nodes/edges) for full-text or regex search features while compiling `new RegExp()` inside the loop introduces a massive performance bottleneck. In this codebase, search evaluation over 5000+ elements compiling a regex per field drastically slowed down UI responsiveness.
**Action:** Whenever implementing search over many nodes, pre-compile the `RegExp` (or pre-lowercase queries for case-insensitive matching) into closure matcher functions *before* the loop. Passing compiled `(text: string) => boolean` matchers down to individual elements achieved a ~3.6x speedup.

## 2024-07-01 - Avoid Array Spread and Mapping for DOM classNames in Hot Loops
**Learning:** Constructing complex DOM `classNames` by creating temporary arrays using spread syntax `...` and `.map()` iterations within hot rendering loops (like iterating over all nodes and edges) introduces unnecessary memory allocation and garbage collection churn, significantly slowing down layout rendering. Using a simple inline string builder (`+=`) in a regular `for` loop is almost 3x faster and avoids allocations.
**Action:** Whenever generating strings (like classes) inside massive iterations, prefer an inline string builder over declarative array-map-join patterns.

## 2024-07-02 - Avoid Object.entries on Hot Paths
**Learning:** In hot rendering and search loops, using `Object.entries()` creates unnecessary array allocations and garbage collection churn, which slows down the operation significantly compared to simple `for..in` loops.
**Action:** Replace `Object.entries` with `for..in` (with `hasOwnProperty` check) when iterating over object properties in performance-critical paths like `#matchElement` and `defaultNodeContent` in `renderer.ts`.

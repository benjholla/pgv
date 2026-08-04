## 2024-05-30 - Remove redundant data structures in Map processing loops
**Learning:** In `@pgv/graph-core`, the `groupByDepth` function in `src/layout.ts` returns a `Map` that is already insertion-ordered by depth. Functions processing these layers (like `computeLayerPositions`) should iterate directly over the map's keys or values rather than manually extracting an array and re-sorting them.
**Action:** Replace `Map` key extraction, array allocation, and sorting logic with direct `Map.prototype.keys()` iteration when the source Map is already known to be insertion-ordered, reducing cognitive load and duplicated logic.

## 2024-05-30 - Eliminate duplicated tracking arrays when Maps exist
**Learning:** In `@pgv/graph-core`, the FLIP animation in `src/renderer.ts` was maintaining its state (DOM elements and layout deltas) using both an array (`flipNodes`) and a Map (`flipNodesMap`).
**Action:** Avoid introducing redundant arrays for node tracking when a Map already exists to correlate state; iterate directly over the map's keys/values for Play and Cleanup steps to eliminate duplicated state management.

## 2024-05-30 - Inline nested closures capturing mutable state
**Learning:** In `@pgv/graph-core`, Kahn's algorithm in `assignVerticalDepths` (within `src/layout.ts`) was implementing cycle-breaking via a nested `dfsBreakCyclesIterative` function that captured several outer scope variables (`stack`, `state`, `acyclicOutgoing`).
**Action:** Inline nested iterative loops directly into the main function body to avoid capturing mutable state across scopes and to reduce the cognitive load of distributed reasoning.- Refactored `assignVerticalDepths` in `src/layout.ts` to eliminate a large block of duplicated Kahn's topological sorting traversal logic without introducing closures (which was discouraged per trace memory), improving maintainability while preserving strict correctness and determinism.

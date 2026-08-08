# Nervous Persona Learnings

## Discovered Test Gaps
During my quality review, I noticed that while the core domain behaviors were heavily tested for standard 'happy paths' (e.g., standard layout operations, typical history diff applications), many explicit mathematical and property-based boundary cases were implicitly assumed rather than strictly proven by tests. I focused on filling these specific invariant gaps without locking into implementation details.

### Boundary Gaps Filled
1.  **Empty Graph Properties:** Added tests to guarantee the system safely constructs, serializes, and applies empty diffs to completely degenerate inputs (graphs with zero nodes, edges, or schema properties) without runtime faults.
2.  **Disjoint Forest Structures:** Verified that the model natively supports disjoint/disconnected graphs, handling multiple isolated root components seamlessly during serialization and DFS traversal.
3.  **Self-Loop Properties:** Added verification that normal directed edges can form self-loops, but strict structural constraints correctly reject length-1 containment cycles (throwing cycle violation errors).
4.  **Malformed Diff Arrays:** Ensured `GraphDiff` generation throws appropriately if users mistakenly specify the same node/edge ID multiple times in their `removedNodes` / `removedEdges` data structures.
5.  **Layout Edge Endpoint Failures:** Confirmed that `edgeEndpoints` securely returns `null` rather than crashing when attempting to resolve invalid edge layout references.
6.  **Lifecycle Invariants:** Proved that `GraphView.destroy()` reliably meets its behavioral contract to sever all active DOM node bindings and cleanly reset the host container, preventing memory leaks on repeated unmounting.

By anchoring tests against expected invariants rather than code paths, the test suite is less brittle and acts as a much more rigorous executable specification for any future alternative implementations.

## 2024-05-18 - [Regression Test] Incremental GraphDiff Rendering vs Full Snapshot
**Gap:** The repository lacked an integration test confirming that applying a series of incremental `GraphDiff` updates to the UI resulted in identical visual layout and edge routing compared to rendering the fully constructed final snapshot from scratch. If FLIP animation state or layout coordinate mappings leaked across diffs, overlapping edges or stale coordinates could drift over time.
**Action:** Added an E2E visual regression test (`test/e2e/incremental-rendering.spec.ts`) that incrementally applies diffs using an exposed `__applyGraphDiff` method and compares the resulting Playwright screenshot directly to the baseline of a full equivalent snapshot rendering, ensuring the visual math is rigorously commutative.

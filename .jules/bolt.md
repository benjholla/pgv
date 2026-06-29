## 2026-06-29 - O(N^2) Iteration Trap in Depth Assignment

**Learning:** Iterating over graph structures where you recalculate aggregate maximums inside a loop over nodes introduces hidden O(N^2) complexity bottlenecks (e.g. `O(V * E)`).

**Action:** Whenever iterating over nodes to assign layers or depths based on graph connectivity, maintain aggregate properties like `currentMaxDepth` explicitly outside the iterative loop to ensure O(N) linear time calculations.

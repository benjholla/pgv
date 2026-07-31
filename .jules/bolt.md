## 2024-05-30 - Replace O(N) array indexOf with O(log N) binary search for edge routing
**Learning:** In `@pgv/graph-core`, `verticalLayout` computes staggering offsets for edges based on their index in the outgoing/incoming list. These lists (`edgeOutgoing`, `edgeIncoming`) are arrays of edge IDs that are sorted sequentially to guarantee deterministic traversal. However, the function later used `Array.prototype.indexOf()` to find an edge's index in the list, resulting in an O(N^2) operation when resolving offsets for all edges on highly-connected nodes.
**Action:** Replaced `indexOf` with a binary search implementation because the target arrays (`edgeOutgoing`, `edgeIncoming`) were already guaranteed to be sorted alphabetically. Measured 5x faster layout on graphs with dense edge connections (star graphs).

## 2024-05-31 - Avoid Array.from on large Iterators in Hot Paths
**Learning:** In `@pgv/graph-core`, `validateStructuralInvariants` is called to validate invariants over the entire graph state. By default, iterables are often passed in (e.g. `edges.values()`). Using `Array.from()` inside a hot validation loop on large graphs (10k+ edges) forces an immediate, synchronous memory allocation and blocks the event loop unnecessarily, when a single pass `for...of` iterator over the edges can perform the same validation checks in significantly less time (1.6x faster measured).
**Action:** Consolidate data validation operations and intermediate adjacency map building into single-pass `for...of` loops where possible to avoid `Array.from` intermediate allocation overheads on large Iterables.

## 2024-06-05 - Replace O(N) array indexOf/includes with O(1) Set lookups in hot loops
**Learning:** In `@pgv/graph-core`, several hot loops over all edges in the graph (`validateStructuralInvariants`, `computeCompoundNodeBounds`, and `renderEdges`) were scanning an edge's tags array against an unoptimized array (`schema.containment.includes(edge.tags[i])`). For dense graphs or graphs with many containment tags, this results in an `O(N * M * K)` operation.
**Action:** Always pre-compute a `Set` from the known constraint list (e.g. `schema.containment`) before entering the hot loop, reducing the inner lookup complexity from `O(K)` linear time to `O(1)` constant time. Measurements confirmed a ~1.5x speedup in the containment checking logic on 10k nodes. Ensure to provide fallback `new Set()` logic for tests passing undefined configs.

## 2024-05-18 - A* ClosedSet Bitmask Mapping
**Learning:** In hot loops like A* pathfinding, JavaScript's `Set<string>` allocations and string concatenation for state hashing (`${x},${y},${dx},${dy}`) cause severe memory churn and GC pauses. On a 200x200 grid, replacing `Set<string>` with a flat `Uint8Array` accessed via `1D_index = (x * yLen + y) * 4 + dir` improves lookups by ~200-300x while virtually eliminating allocations.
**Action:** Always prefer flat typed array indexing over string-based Hash Sets/Maps for dense coordinate matrices in performance critical algorithms.
## 2024-05-24 - Map lookups in pathfinding hot loops
**Learning:** During A* orthogonal routing, checking `layout.hierarchy?.has(id)` inside `isSegmentValid` means doing an O(N) lookup repeatedly for *every* line segment checked. Removing the map lookup from this innermost hot loop and filtering compound nodes out during the initial O(N) array allocation step (`obstacles.push`) makes edge routing ~35% faster.
**Action:** Always filter mapping and checking variables as early as possible before entering hot tight loops (like pathfinding algorithms or rendering loops).
## 2024-11-20 - Avoid Array.filter allocation in topological sorting roots setup
**Learning:** In `@pgv/graph-core`, `Array.filter` inside `layoutTopologicalSort` (line 669) creates an intermediate array and closure overhead in a hot layout preprocessing step. Benchmarks confirm a standard `for` loop with `push` is significantly faster.
**Action:** Replaced `.filter` with a standard loop pushing directly to an array to avoid closures and memory allocations, improving layout graph initialization speed.
## 2023-10-27 - Object.entries vs for...in
**Learning:** In `@pgv/graph-core`, contrary to common anti-pattern assumptions, iterating over `node.attributes` (or similar objects) in hot paths using a `for...in` loop combined with `Object.prototype.hasOwnProperty.call` is significantly faster (~4-6x) than `Object.entries()`, as it avoids intermediate array allocations.
**Action:** When iterating over dynamic objects (like attributes) in performance-critical areas like search matching, prefer `for...in` loops with `hasOwnProperty` checks over `Object.entries` or `Object.keys` to avoid array allocation overhead.
## 2024-07-29 - Avoid array allocation from Object.entries in rendering and validation loops
**Learning:** In `@pgv/graph-core`, using `Object.entries()` to iterate over objects like attributes inside hot rendering or validation loops (`createSvgElement`, `defaultNodeContent`, `freezeAttributes`) creates intermediate array allocations. This impacts performance, especially for graphs with many nodes and attributes.
**Action:** Replace `Object.entries()` with `for...in` loops combined with `Object.prototype.hasOwnProperty.call()` checks to avoid intermediate array allocations in performance-critical paths, matching the pattern already used elsewhere in the codebase.
## 2024-11-21 - Avoid Array.from allocation and filter chain on Sets
**Learning:** In `@pgv/graph-core`, `Array.from(set).filter(...)` creates an intermediate array and closure overhead in hot layout preprocessing steps like `identifyCompoundNodes` (line 829). Benchmarks confirm a standard `for...of` loop with an `if` check and `push` is significantly faster and avoids memory chunk allocation.
**Action:** Always prefer a single-pass `for...of` loop over a `Set` instead of `Array.from` followed by higher-order array methods in performance-critical hot paths.
## 2025-02-12 - Avoid Object.keys() array allocation in hot paths
**Learning:** In `@pgv/graph-core`, using `Object.keys()` to count attributes inside hot layout sizing logic (`estimateNodeHeight`) or attribute validation (`isValid` for model validation) creates intermediate array allocations. This impacts performance, especially for graphs with many nodes and attributes.
**Action:** Replace `Object.keys(obj).length` or `Object.keys(obj)[0]` with a `for...in` loop combined with an `Object.prototype.hasOwnProperty.call(obj, key)` check to count keys and extract values without generating intermediate arrays.

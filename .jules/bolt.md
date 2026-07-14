## 2024-05-15 - Array Shift vs Pop in Hot Loops
**Learning:** Using `Array.prototype.shift()` as an extraction method for a sorted priority queue in hot pathfinding loops (like A* in `edgeEndpoints`) causes O(N) operations and significant slowdowns as array sizes increase.
**Action:** Sort arrays in descending order (`b - a`) and use `Array.prototype.pop()` for O(1) extraction of the minimum element instead of sorting ascending and using `.shift()`.

## 2026-07-12 - String Matching Optimization
**Learning:** Using `RegExp.test()` for simple case-insensitive substring searches is noticeably slower (~1.6x) than explicitly calling `.toLowerCase().includes(queryLower)`.
**Action:** For simple case-insensitive searches where regular expression semantics are not needed, convert the query to lowercase ahead of time and use `text.toLowerCase().includes(queryLower)` instead of dynamically compiling and testing a `RegExp` with the `'i'` flag.
## 2025-02-12 - Inline orthogonal layout direction checks
**Learning:** In A* pathfinding (like edge orthogonal layout routing), allocating intermediate objects inside hot loops `const dirs = [{dx:0, dy:-1}, ...]` causes GC churn and slower execution, even when loop bounds are small.
**Action:** Replace dynamically allocated object array loops with explicitly unrolled iterations or simple scalar loops using `if-else` branches when the number of directions is known and fixed.
## $(date +%Y-%m-%d) - Optimize Array.from usages
**Learning:** `Array.from()` on Maps or Sets is noticeably slower than creating a pre-allocated array (e.g. `new Array(map.size)`) and populating it with a simple `for...of` loop in this codebase.
**Action:** When working in hot paths (like layout algorithms) that need to transform iterables into arrays before sorting, manually pre-allocate the array for a measurable performance gain.

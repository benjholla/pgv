## 2024-05-15 - Array Shift vs Pop in Hot Loops
**Learning:** Using `Array.prototype.shift()` as an extraction method for a sorted priority queue in hot pathfinding loops (like A* in `edgeEndpoints`) causes O(N) operations and significant slowdowns as array sizes increase.
**Action:** Sort arrays in descending order (`b - a`) and use `Array.prototype.pop()` for O(1) extraction of the minimum element instead of sorting ascending and using `.shift()`.

## 2026-07-12 - String Matching Optimization
**Learning:** Using `RegExp.test()` for simple case-insensitive substring searches is noticeably slower (~1.6x) than explicitly calling `.toLowerCase().includes(queryLower)`.
**Action:** For simple case-insensitive searches where regular expression semantics are not needed, convert the query to lowercase ahead of time and use `text.toLowerCase().includes(queryLower)` instead of dynamically compiling and testing a `RegExp` with the `'i'` flag.

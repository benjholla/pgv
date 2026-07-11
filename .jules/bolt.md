## 2024-05-15 - Array Shift vs Pop in Hot Loops
**Learning:** Using `Array.prototype.shift()` as an extraction method for a sorted priority queue in hot pathfinding loops (like A* in `edgeEndpoints`) causes O(N) operations and significant slowdowns as array sizes increase.
**Action:** Sort arrays in descending order (`b - a`) and use `Array.prototype.pop()` for O(1) extraction of the minimum element instead of sorting ascending and using `.shift()`.

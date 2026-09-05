def get_issue():
    # In @pgv/graph-core, the `routeEdgeOrthogonal` A* pathfinding algorithm in `src/layout.ts` relies on a custom `MinHeap` priority queue for its `openList` to ensure `O(log N)` minimum `f` score extraction. Avoid `O(N)` linear array scans here, as they severely bottleneck dense graph routing performance.
    # We need to implement a MinHeap for the openList in routeEdgeOrthogonal and replace the O(N) scan.
    pass

# Test Coverage Gaps and Unreachable Code Findings

During an audit of test coverage based on the "Bouncer" philosophy, the following gaps were identified and should be addressed in subsequent efforts:

## src/model.ts
- Missing test coverage for handling blank/whitespace-only strings in validation (e.g., `graphId` and `tags`).
- Missing test cases verifying defensive sanitization of nested `script` tags during XSS filtering.
- Missing test cases covering different HTML entity encoding edge-cases.
- Missing coverage for graph diff serialization/deserialization for nodes that include a `parent` field (`graphDiffToJson`).
- Several defensive runtime branches are effectively unreachable due to prior explicit validation.

## src/renderer.ts
- Missing test coverage for the Least-Recently-Used (LRU) `tagCache` size eviction mechanism inside `tagToClassName` (when size exceeds 10,000 entries).

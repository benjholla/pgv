## 2026-07-09 - Repository Hygiene and Debt Cleanup
- Removed obsolete `useSearch: true` parameter from `examples/vite-static/src/main.ts` and `examples/vite-dynamic/src/main.ts` since the search UI is now enabled unconditionally and the option was removed from `GraphViewOptions`.
- Cleaned up lingering TSDoc comments and removed `version` and `graphId` across `src/model.ts` and test files, consistent with the architectural decision that these properties have been permanently removed.
- Refactored all uses of `applyGraphDiff` to match the updated 2-argument signature by removing the obsolete 3rd parameter.
- Ensured that TypeDoc, tests, and build tools complete successfully with the cleaned-up configurations.
## 2024-07-10 - Remove Unused GraphSchema Parameter from GraphView

When cleaning up unused parameters in public APIs (e.g., removing `schema` from `GraphView` constructor), always remember to systematically locate all instantiations in test code and examples to avoid breaking downstream usages. Furthermore, removing dead code that triggers unnecessary remote requests in examples (e.g., fetching `schema.json`) greatly improves both code cleanliness and performance.

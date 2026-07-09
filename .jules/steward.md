## 2026-07-09 - Repository Hygiene and Debt Cleanup
- Removed obsolete `useSearch: true` parameter from `examples/vite-static/src/main.ts` and `examples/vite-dynamic/src/main.ts` since the search UI is now enabled unconditionally and the option was removed from `GraphViewOptions`.
- Cleaned up lingering TSDoc comments and removed `version` and `graphId` across `src/model.ts` and test files, consistent with the architectural decision that these properties have been permanently removed.
- Refactored all uses of `applyGraphDiff` to match the updated 2-argument signature by removing the obsolete 3rd parameter.
- Ensured that TypeDoc, tests, and build tools complete successfully with the cleaned-up configurations.

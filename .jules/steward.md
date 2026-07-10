## 2026-07-09 - Repository Hygiene and Debt Cleanup
- Removed obsolete `useSearch: true` parameter from `examples/vite-static/src/main.ts` and `examples/vite-dynamic/src/main.ts` since the search UI is now enabled unconditionally and the option was removed from `GraphViewOptions`.
- Cleaned up lingering TSDoc comments and removed `version` and `graphId` across `src/model.ts` and test files, consistent with the architectural decision that these properties have been permanently removed.
- Refactored all uses of `applyGraphDiff` to match the updated 2-argument signature by removing the obsolete 3rd parameter.
- Ensured that TypeDoc, tests, and build tools complete successfully with the cleaned-up configurations.
## 2024-07-10 - Document Unused but Necessary Groundwork Parameters

When a parameter (like `schema` in `GraphView` constructor) appears unused but serves as groundwork for future architectural features (e.g., semantic containment relationships), it is crucial to fully document its intent using TSDoc rather than removing it. Removing it destroys planned context, while documenting it prevents documentation rot and confusion for future developers.

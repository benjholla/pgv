## 2024-05-18 - Missing focus-visible on dropdown buttons
**Learning:** Smart view dropdown buttons lack keyboard focus outline (`:focus-visible`), hindering accessibility for keyboard navigation.
**Action:** When adding new interactive components, always ensure `:focus-visible` styles are implemented using standard design variables like `--pgv-selected-color` to maintain accessibility.

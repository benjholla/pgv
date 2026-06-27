## 2024-06-27 - Missing Focus Indicators on Custom Buttons
**Learning:** Custom UI control buttons within this project (`.pgv-controls button`, `.pgv-history-controls button`) completely lack `:focus-visible` styling, making keyboard navigation difficult and inaccessible.
**Action:** Always verify that custom interactive elements define visible focus states (e.g., using `outline` or `box-shadow`) matching the design system's tokens (like `--pgv-selected-shadow`).

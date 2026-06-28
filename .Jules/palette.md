## 2024-06-27 - Missing Focus Indicators on Custom Buttons
**Learning:** Custom UI control buttons within this project (`.pgv-controls button`, `.pgv-history-controls button`) completely lack `:focus-visible` styling, making keyboard navigation difficult and inaccessible.
**Action:** Always verify that custom interactive elements define visible focus states (e.g., using `outline` or `box-shadow`) matching the design system's tokens (like `--pgv-selected-shadow`).

## 2024-06-27 - Keyboard Focus Separation from Selection
**Learning:** Automatically triggering "selection" events merely from keyboard tabbing (focus) across graph elements causes unintended side effects. Users perceive keyboard focus as "inspecting" and expect an explicit action (like hitting "Enter" or "Space") to commit a "selection".
**Action:** Separate visual indicators for `:focus-visible` (e.g., using a distinct orange color) from `.pgv-selected` (e.g., blue). Add keyboard event listeners (`keydown` for Enter/Space) on focusable elements to programmatically trigger the selection callbacks.

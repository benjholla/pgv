
## 2024-06-29 - Global Graph Keyboard Accessibility Behaviors
**Learning:** Proper keyboard navigation requires careful orchestration of focus states, action bindings, and DOM ordering. Specifically:
1. **Control Highlight Consistency:** Controls should use standard design-system colors (e.g., blue `--pgv-selected-color`) for `:focus-visible` to maintain visual consistency.
2. **Focus vs Selection:** Keyboard focus (inspecting) should be visually distinct (e.g., orange `--pgv-focus-color`) from selection (e.g., blue). Committing a selection should explicitly require `Enter` or `Space`, and not auto-trigger on focus.
3. **Tab Order & Structure:** Native browser tab enumeration (using `tabindex="0"`) is highly preferred over arbitrary indexed counts. To control flow (e.g., UI controls -> Nodes -> Edges), physically construct the DOM in that exact order and use `z-index` if visual layering must contradict DOM layering.
4. **Auto-Centering:** When the user tabs to a graph element off-screen, auto-panning the canvas via a `focus` capture listener prevents the user from "losing" their cursor.
**Action:** Implement these behaviors rigorously across new UI components.
## 2026-06-29 - Adding ARIA attributes to generated DOM components
**Learning:** When programmatically building complex DOM elements (like the search bar in this application) using `document.createElement`, it is easy to miss adding `aria-label` attributes to inputs, selects, and icon-only buttons, as they don't have static HTML templates where linters might catch them.
**Action:** When creating new UI controls or reviewing DOM-generation code, always explicitly check if non-text interactive elements (buttons with SVGs, inputs, selects) have an `aria-label` set via `setAttribute` or a visible associated label.
## 2026-06-30 - Dynamic ARIA Attributes for Custom Controls
**Learning:** When creating custom interactive components like dropdowns and toggle buttons in pure JavaScript, static ARIA attributes are insufficient. Screen readers require stateful updates (like `aria-expanded` on dropdown triggers and `aria-pressed` on custom toggles) to be synchronized synchronously with the underlying javascript state model and the visual DOM classes.
**Action:** When creating or modifying custom UI controls, always verify that the relevant stateful ARIA attributes are initialized correctly and updated inside the same event listeners that update the visual DOM state.

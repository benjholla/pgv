
## 2024-06-29 - Global Graph Keyboard Accessibility Behaviors
**Learning:** Proper keyboard navigation requires careful orchestration of focus states, action bindings, and DOM ordering. Specifically:
1. **Control Highlight Consistency:** Controls should use standard design-system colors (e.g., blue `--pgv-selected-color`) for `:focus-visible` to maintain visual consistency.
2. **Focus vs Selection:** Keyboard focus (inspecting) should be visually distinct (e.g., orange `--pgv-focus-color`) from selection (e.g., blue). Committing a selection should explicitly require `Enter` or `Space`, and not auto-trigger on focus.
3. **Tab Order & Structure:** Native browser tab enumeration (using `tabindex="0"`) is highly preferred over arbitrary indexed counts. To control flow (e.g., UI controls -> Nodes -> Edges), physically construct the DOM in that exact order and use `z-index` if visual layering must contradict DOM layering.
4. **Auto-Centering:** When the user tabs to a graph element off-screen, auto-panning the canvas via a `focus` capture listener prevents the user from "losing" their cursor.
**Action:** Implement these behaviors rigorously across new UI components.

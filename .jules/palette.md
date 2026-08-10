## 2026-08-09 - [Added aria-disabled to Smart View Controls]
**Learning:** In `@pgv/graph-core`, disabled interactive buttons (like Search, History, or Smart View controls) use `aria-disabled="true"` rather than the native `disabled` attribute to preserve focusability for keyboard navigation and tooltips. Click handlers must explicitly return early if this attribute is set, and CSS must provide corresponding visual feedback (e.g., opacity and cursor changes).
**Action:** When adding new controls, ensure their disabled states are explicitly modeled with `aria-disabled="true"` and verified in event listeners, instead of relying on native disabled attributes which break accessibility patterns in this repo.

## 2026-08-09 - [Added type="button" to dynamic buttons]
**Learning:** In `@pgv/graph-core`, when dynamically creating interactive `<button>` elements via DOM APIs (e.g., node collapse toggles in `src/renderer.ts`), always explicitly set `type="button"`. If omitted, buttons implicitly act as submit buttons and can cause accidental page reloads when the graph is embedded inside external HTML forms.
**Action:** When creating a new `<button>` programmatically, ensure `btn.type = "button";` is immediately assigned.

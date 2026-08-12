## 2026-08-09 - [Added aria-disabled to Smart View Controls]
**Learning:** In `@pgv/graph-core`, disabled interactive buttons (like Search, History, or Smart View controls) use `aria-disabled="true"` rather than the native `disabled` attribute to preserve focusability for keyboard navigation and tooltips. Click handlers must explicitly return early if this attribute is set, and CSS must provide corresponding visual feedback (e.g., opacity and cursor changes).
**Action:** When adding new controls, ensure their disabled states are explicitly modeled with `aria-disabled="true"` and verified in event listeners, instead of relying on native disabled attributes which break accessibility patterns in this repo.

## 2026-08-09 - [Added type="button" to dynamic buttons]
**Learning:** In `@pgv/graph-core`, when dynamically creating interactive `<button>` elements via DOM APIs (e.g., node collapse toggles in `src/renderer.ts`), always explicitly set `type="button"`. If omitted, buttons implicitly act as submit buttons and can cause accidental page reloads when the graph is embedded inside external HTML forms.
**Action:** When creating a new `<button>` programmatically, ensure `btn.type = "button";` is immediately assigned.

## 2026-08-11 - [Added explanatory tooltips to disabled aria-disabled buttons]
**Learning:** In `@pgv/graph-core`, when using `aria-disabled="true"` on interactive control buttons, dynamically updating their `title` and `aria-label` attributes to explicitly explain *why* the action is disabled (e.g., 'Cannot decrease below 0 steps' or 'Already transitively walking') provides a significant UX and accessibility enhancement for both sighted and screen reader users. This turns a generic disabled state into actionable feedback.
**Action:** When implementing or updating buttons that rely on `aria-disabled="true"`, always assign context-aware `title` and `aria-label` strings that explain the disabled reason, rather than leaving them statically set to their enabled labels.

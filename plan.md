1. **Analyze existing `:focus-visible` styles**
   - The `.pgv-smart-dropdown-btn` doesn't currently have a `:focus-visible` pseudo-class for accessible keyboard focus outline.
2. **Add `:focus-visible` for `.pgv-smart-dropdown-btn` in `src/style.css`**
   - We will append it to the existing focus-visible block for `.pgv-control-split-button button:focus-visible` (around line 1122) or create a new block near line 1200.
3. **Run tests & pre-commit checks**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Submit PR**
   - Push branch and create PR with the fix.

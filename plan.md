1. **Understand Goal**: As the "Skeptic", identify and remove unnecessary complexity, eliminate duplication, and improve code structure without changing behavior or public APIs.
2. **Identify Complexity / Duplication**:
    - In `src/renderer.ts`, the logic to extract a node's display title (`XCSG.name` or `node.id`) is duplicated in multiple places: `renderSingleNode` (lines 3496, 3520, 3552) and `defaultNodeContent` (line 3633). This is an incidental implementation detail polluting the render logic.
3. **Plan**:
    - Extract a cohesive helper function `getNodeTitle(node: GraphNode): string` in `src/renderer.ts` (or `src/model.ts` if appropriate, but it's UI specific, so `src/renderer.ts` is fine).
    - Replace all occurrences of `typeof node.attributes["XCSG.name"] === "string" ? node.attributes["XCSG.name"] : node.id` with `getNodeTitle(node)`.
    - Run the test suite to ensure correctness.
4. **Complete Pre-commit Steps**:
    - Follow instructions from `pre_commit_instructions` tool to verify.
5. **Submit**:
    - Submit branch with clear message describing the complexity reduction.

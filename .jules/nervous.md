# Quality Discoveries (Nervous Persona)

* Discovered that the boundary behavior of `applyGraphDiff` replacing an entity (i.e. removing and adding it in the same diff) was undocumented and untested behavior despite being mathematically possible.
* Added `test/model/apply-graph-diff-replacement.test.ts` to strictly assert the conceptual replacement edge case for both nodes and edges where their attributes are modified.
* Ensuring the tests validate the correct behavior without accessing or depending on the internal model logic.
* Discovered that `getHiddenNodes` had untested properties including empty inputs, redundancy, disconnected components, and containment. Added tests in `test/layout/hidden-nodes-properties.test.ts`.
* Discovered missing idempotency and involutory property validation for `invertGraphDiff`. Added `test/model/invert-graph-diff-properties.test.ts` to assert that double-inverting back-to-back yields the exact original diff.
* Validated short-circuit initialization performance behaviors for compound nodes when containment schemas are completely missing in `test/layout/compound-nodes-short-circuit.test.ts`.
* Added `test/layout/edge-endpoints-staggering.test.ts` to strictly assert that single/isolated edges have no horizontal stagger offset applied to endpoints.

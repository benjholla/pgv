# Quality Discoveries (Nervous Persona)

* Discovered that the boundary behavior of `applyGraphDiff` replacing an entity (i.e. removing and adding it in the same diff) was undocumented and untested behavior despite being mathematically possible.
* Added `test/model/apply-graph-diff-replacement.test.ts` to strictly assert the conceptual replacement edge case for both nodes and edges where their attributes are modified.
* Ensuring the tests validate the correct behavior without accessing or depending on the internal model logic.

* In `@pgv/graph-core`, the `invertGraphDiff` function satisfies the involution property: applying it to the resulting snapshot using its own inverse (`invertGraphDiff(nextSnap, invertGraphDiff(base, diff))`) yields a diff that is mathematically identical to the original `diff`.

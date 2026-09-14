# Quality Discoveries (Nervous Persona)

* Discovered that the boundary behavior of `applyGraphDiff` replacing an entity (i.e. removing and adding it in the same diff) was undocumented and untested behavior despite being mathematically possible.
* Added `test/model/apply-graph-diff-replacement.test.ts` to strictly assert the conceptual replacement edge case for both nodes and edges where their attributes are modified.
* Ensuring the tests validate the correct behavior without accessing or depending on the internal model logic.
## 2024-05-27 - A* Pathfinding Alternate Routing
**Learning:** When using A* to route orthogonal lines in `@pgv/graph-core`, edges leaving a common node and entering common adjacent nodes may overlap (like fan-outs) due to sharing identical start and end point geometries.
**Action:** When adding heuristics to penalize routing bends during A* line calculation for multiple overlapping sources/targets, penalize odd/even `outIndex` differently so alternate paths select non-overlapping symmetric layouts (e.g., using `outIndex % 2 === 0` vs `outIndex % 2 === 1` when `outIndex === inIndex`).

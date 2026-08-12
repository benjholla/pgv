// If `allowedY1 !== allowedY2` in the fallback, we should add an intermediate point to make it orthogonal!
// e.g. `[ sourcePt, { x: sourcePt.x, y: allowedY1 }, { x: (sourcePt.x + targetPt.x)/2, y: allowedY1 }, { x: (sourcePt.x + targetPt.x)/2, y: allowedY2 }, { x: targetPt.x, y: allowedY2 }, targetPt ]`
// But wait, my fix fixed the test, which used the fallback.
// And `segmentsOverlap` checked for orthogonal segments!
// If there was a diagonal line, `segmentsOverlap` would just ignore it because it checks `a1.x === a2.x` or `a1.y === a2.y`.
// But wait! When A* SUCCEEDS, it doesn't return the fallback!
// In the test, A* SUCCEEDED. The paths printed were:
// path1: [ { x: 134, y: -100 }, { x: 134, y: -80 }, { x: 75, y: 55 }, { x: 75, y: 75 } ]
// Wait... if A* succeeded, why is it returning a diagonal line?!
// It's returning `[ { x: 134, y: -100 }, { x: 134, y: -80 }, { x: 75, y: 55 }, { x: 75, y: 75 } ]`.
// That is EXACTLY the fallback line!
// Let me run `test_astar_fallback.ts` again to see what it printed.
// Wait, I did. `test_endpoints_2.ts` printed:
// path1: [ { x: 134, y: 0 }, { x: 134, y: 20 }, { x: 130, y: 20 }, { x: 120, y: 20 }, { x: 75, y: 20 }, { x: 75, y: 30 }, { x: 75, y: 50 } ]
// Ah! In `test_endpoints_2.ts`, A* SUCCEEDS.
// Why did A* fail in `test_astar_fallback.ts`?
// Because `test_astar_fallback.ts` has `sourcePt = { x: 150, y: -100 }` and `hierarchy: new Map()`.
// `test_endpoints_2.ts` has `sourcePt1 = { x: 134, y: 0 }`.
// The physical space is positive.
// In `test_astar_fallback.ts`, `sourcePt = { x: 150, y: -100 }` and `targetPt1 = { x: 75, y: 75 }`.
// Oh!

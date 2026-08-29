import { describe, it, expect } from "vitest";
import { edgeEndpoints } from "../../src/layout";
import { GraphEdge, LayoutSnapshot } from "../../src/model";

describe("Edge Endpoints Staggering Properties", () => {
    it("Single Edge Property: An isolated edge between two nodes connects to their exact geometrical centers without horizontal offset", () => {
        const layout: LayoutSnapshot = {
            positions: new Map([
                ["A", { x: 50, y: 50 }],
                ["B", { x: 50, y: 150 }]
            ]),
            nodeSizes: new Map([
                ["A", { width: 100, height: 50 }],
                ["B", { width: 100, height: 50 }]
            ]),
            hierarchy: new Map(),
            nodeSize: { width: 100, height: 50 },
            width: 200,
            height: 200
        };

        const edge: GraphEdge = { id: "e1", source: "A", target: "B", tags: [], attributes: {} };

        // Force the routing hints map to only contain this one edge
        const edgeRoutingHints = new Map([
            ["e1", { sourceOffsetPx: 0, targetOffsetPx: 0, outIndex: 0, inIndex: 0, outTotal: 1, inTotal: 1 }]
        ]);

        const result = edgeEndpoints(edge, layout, edgeRoutingHints);

        expect(result).not.toBeNull();
        if (result) {
            // Path from A to B should start at the bottom center of A (100, 100)
            // and end at the top center of B (100, 150)
            const firstPt = result.path[0];
            const lastPt = result.path[result.path.length - 1];

            expect(firstPt.x).toBe(100);
            expect(firstPt.y).toBe(100); // 50 + 50
            expect(lastPt.x).toBe(100);
            expect(lastPt.y).toBe(150); // 150 + 0
        }
    });
});

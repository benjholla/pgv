import { describe, it, expect } from "vitest";
import { edgeEndpoints } from "../../src/layout";
import { createGraphSnapshot, GraphEdge } from "../../src/model";

describe("edgeEndpoints Boundary Conditions", () => {
    it("Missing Layout References Property: edgeEndpoints gracefully returns null for invalid references", () => {
        const snap = createGraphSnapshot({
            nodes: [{ id: "A" }],
            edges: []
        });

        // Fabricate an edge that has no layout positions in the fake layout
        const fakeEdge: GraphEdge = { id: "e1", source: "MissingSource", target: "MissingTarget", tags: [], attributes: {} };

        const fakeLayout = {
            width: 100, height: 100, nodeSizes: new Map(), positions: new Map(), routingHints: new Map(), renderOrder: []
        };

        const result = edgeEndpoints(fakeEdge, fakeLayout);
        expect(result).toBeNull();
    });

    it("Singleton Input Property: edgeEndpoints gracefully handles graphs with a single node and a self-loop", () => {
        // Construct edge mapping to self, layout has identical coords for start and target
        const fakeEdge: GraphEdge = { id: "e1", source: "A", target: "A", tags: [], attributes: {} };
        const fakeLayout = {
            width: 100, height: 100,
            nodeSizes: new Map([["A", { width: 50, height: 50 }]]),
            positions: new Map([["A", { x: 0, y: 0 }]]),
            routingHints: new Map(), renderOrder: []
        };
        const result = edgeEndpoints(fakeEdge, fakeLayout);
        expect(result).not.toBeNull();
        expect(result!.path.length).toBeGreaterThan(0);
    });
});

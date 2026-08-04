import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff } from "../../src/model";

describe("Immutability Properties", () => {
    it("GraphSnapshot is deeply frozen", () => {
        const snap = createGraphSnapshot({
            nodes: [{ id: "A", tags: ["start"], attributes: { key: "val" } }],
            edges: []
        });

        expect(Object.isFrozen(snap)).toBe(true);
        expect(Object.isFrozen(snap.nodes.get("A"))).toBe(true);
        expect(Object.isFrozen(snap.nodes.get("A")?.tags)).toBe(true);
        expect(Object.isFrozen(snap.nodes.get("A")?.attributes)).toBe(true);
    });

    it("GraphDiff is deeply frozen", () => {
        const diff = createGraphDiff({
            addedNodes: [{ id: "B", tags: ["end"], attributes: { num: { integer: 1 } } }],
            addedEdges: [{ id: "e1", source: "A", target: "B" }]
        });

        expect(Object.isFrozen(diff)).toBe(true);
        expect(Object.isFrozen(diff.addedNodes)).toBe(true);
        expect(Object.isFrozen(diff.addedNodes[0])).toBe(true);
        expect(Object.isFrozen(diff.addedNodes[0].tags)).toBe(true);
        expect(Object.isFrozen(diff.addedNodes[0].attributes)).toBe(true);
        expect(Object.isFrozen(diff.addedNodes[0].attributes.num)).toBe(true);
        expect(Object.isFrozen(diff.addedEdges)).toBe(true);
        expect(Object.isFrozen(diff.removedNodes)).toBe(true);
        expect(Object.isFrozen(diff.removedEdges)).toBe(true);
    });
});

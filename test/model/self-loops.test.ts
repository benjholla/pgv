import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, GraphModelError } from "../../src/model";

describe("Self-Loops Properties", () => {
    it("Valid Self-Loop Property: Non-containment edges can loop to the same node", () => {
        const snap = createGraphSnapshot({
            nodes: [{ id: "A" }],
            edges: [
                { id: "e1", source: "A", target: "A" } // Self loop
            ]
        });

        expect(snap.edges.size).toBe(1);
        expect(snap.edges.get("e1")?.source).toBe("A");
        expect(snap.edges.get("e1")?.target).toBe("A");
    });

    it("Containment Self-Loop Invalidity: A containment edge cannot form a self-loop (length-1 cycle)", () => {
        expect(() => createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "A" }],
            edges: [
                { id: "e1", source: "A", target: "A", tags: ["contains"] }
            ]
        })).toThrow(GraphModelError);
        expect(() => createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "A" }],
            edges: [
                { id: "e1", source: "A", target: "A", tags: ["contains"] }
            ]
        })).toThrow(/cycle/i);
    });

    it("Dynamic Enforce Containment Self-Loop Property: Applying a diff that adds a containment self-loop throws", () => {
        const base = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "A" }],
            edges: []
        });

        const diff = createGraphDiff({
            addedEdges: [{ id: "e1", source: "A", target: "A", tags: ["contains"] }]
        });

        expect(() => applyGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => applyGraphDiff(base, diff)).toThrow(/cycle/i);
    });
});

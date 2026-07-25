import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, GraphModelError } from "../../src/model";

describe("Containment Structural Invariants", () => {
    it("Tree/Forest Structure Property: A node can have at most one containment parent", () => {
        expect(() => createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "n1" }, { id: "n2" }, { id: "child" }],
            edges: [
                { id: "e1", source: "n1", target: "child", tags: ["contains"] },
                { id: "e2", source: "n2", target: "child", tags: ["contains"] }
            ]
        })).toThrow(GraphModelError);
        expect(() => createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "n1" }, { id: "n2" }, { id: "child" }],
            edges: [
                { id: "e1", source: "n1", target: "child", tags: ["contains"] },
                { id: "e2", source: "n2", target: "child", tags: ["contains"] }
            ]
        })).toThrow(/multiple parent/i);
    });

    it("Independence Property: Non-containment edges do not affect containment invariants", () => {
        const snap = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "n1" }, { id: "n2" }, { id: "child" }],
            edges: [
                { id: "e1", source: "n1", target: "child", tags: ["contains"] },
                { id: "e2", source: "n2", target: "child", tags: ["dependency"] } // Different tag
            ]
        });

        expect(snap.nodes.size).toBe(3);
        expect(snap.edges.size).toBe(2);
    });

    it("Dynamic Enforce Property: Applying a diff that violates the single-parent invariant throws", () => {
        const base = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "n1" }, { id: "n2" }, { id: "child" }],
            edges: [
                { id: "e1", source: "n1", target: "child", tags: ["contains"] }
            ]
        });

        const diff = createGraphDiff({
            addedEdges: [{ id: "e2", source: "n2", target: "child", tags: ["contains"] }]
        });

        expect(() => applyGraphDiff(base, diff)).toThrow(GraphModelError);
        expect(() => applyGraphDiff(base, diff)).toThrow(/multiple parent/i);
    });

    it("Acyclicity Property: Containment edges cannot form cycles", () => {
        expect(() => createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
            edges: [
                { id: "e1", source: "A", target: "B", tags: ["contains"] },
                { id: "e2", source: "B", target: "C", tags: ["contains"] },
                { id: "e3", source: "C", target: "A", tags: ["contains"] } // Cycle
            ]
        })).toThrow(GraphModelError);
        expect(() => createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
            edges: [
                { id: "e1", source: "A", target: "B", tags: ["contains"] },
                { id: "e2", source: "B", target: "C", tags: ["contains"] },
                { id: "e3", source: "C", target: "A", tags: ["contains"] } // Cycle
            ]
        })).toThrow(/cycle/i);
    });
});

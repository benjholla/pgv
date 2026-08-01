import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, applyGraphDiff, traverseDfs } from "../../src/model";

describe("Disjoint Graphs and Disconnected Components Properties", () => {
    it("Disjoint Subgraphs Property: Multiple disconnected graphs can coexist in a single snapshot", () => {
        const snap = createGraphSnapshot({
            nodes: [{ id: "A1" }, { id: "B1" }, { id: "A2" }, { id: "B2" }],
            edges: [
                { id: "e1", source: "A1", target: "B1" },
                { id: "e2", source: "A2", target: "B2" }
            ]
        });

        expect(snap.nodes.size).toBe(4);
        expect(snap.edges.size).toBe(2);
    });

    it("Containment Disjoint Trees Property: A valid forest of containment trees can be serialized", () => {
        const snap = createGraphSnapshot({
            schema: { containment: ["contains"] },
            nodes: [{ id: "Root1" }, { id: "Child1" }, { id: "Root2" }, { id: "Child2" }],
            edges: [
                { id: "e1", source: "Root1", target: "Child1", tags: ["contains"] },
                { id: "e2", source: "Root2", target: "Child2", tags: ["contains"] }
            ]
        });

        expect(snap.nodes.size).toBe(4);
    });

    it("Disjoint Roots Property: traverseDfs handles multiple independent components correctly", () => {
        const graph = new Map<string, string[]>([
            ["A", ["B"]],
            ["B", []],
            ["C", ["D"]],
            ["D", []]
        ]);

        const getChildren = (id: string) => graph.get(id);

        const result = traverseDfs(["A", "C"], getChildren, () => {});

        expect(result.size).toBe(4);
        expect(result.has("A")).toBe(true);
        expect(result.has("B")).toBe(true);
        expect(result.has("C")).toBe(true);
        expect(result.has("D")).toBe(true);
    });
});

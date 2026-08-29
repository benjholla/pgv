import { describe, it, expect } from "vitest";
import { getHiddenNodes } from "../../src/layout";

describe("Hidden Nodes Properties", () => {
    it("Empty Input Property: handles empty collapsed nodes without errors", () => {
        const getChildren = (id: string) => undefined;
        const result = getHiddenNodes([], getChildren);
        expect(result.size).toBe(0);
    });

    it("Containment Property: hides all descendant nodes of collapsed nodes", () => {
        const hierarchy = new Map<string, string[]>([
            ["A", ["B", "C"]],
            ["B", ["D"]],
            ["C", []],
            ["D", []],
        ]);
        const getChildren = (id: string) => hierarchy.get(id);

        const result = getHiddenNodes(["A"], getChildren);
        expect(result.size).toBe(3);
        expect(result.has("B")).toBe(true);
        expect(result.has("C")).toBe(true);
        expect(result.has("D")).toBe(true);
        // "A" itself should not be hidden, it is collapsed
        expect(result.has("A")).toBe(false);
    });

    it("Redundancy Property: ignores redundant collapsed nodes", () => {
         const hierarchy = new Map<string, string[]>([
            ["A", ["B"]],
            ["B", ["C"]],
            ["C", []],
        ]);
        const getChildren = (id: string) => hierarchy.get(id);

        // Providing both A and B. Hiding A inherently hides B.
        const result = getHiddenNodes(["A", "B"], getChildren);
        expect(result.size).toBe(2);
        expect(result.has("B")).toBe(true);
        expect(result.has("C")).toBe(true);
    });

    it("No Children Property: handles collapsed nodes with no children gracefully", () => {
         const hierarchy = new Map<string, string[]>([
            ["A", []],
        ]);
        const getChildren = (id: string) => hierarchy.get(id);

        const result = getHiddenNodes(["A"], getChildren);
        expect(result.size).toBe(0);
    });

    it("Multiple Disconnected Components Property: correctly computes hidden nodes across independent components", () => {
        const hierarchy = new Map<string, string[]>([
            ["A", ["A1"]],
            ["A1", []],
            ["B", ["B1"]],
            ["B1", []],
            ["C", []] // C is completely independent
        ]);
        const getChildren = (id: string) => hierarchy.get(id);

        const result = getHiddenNodes(["A", "B"], getChildren);
        expect(result.size).toBe(2);
        expect(result.has("A1")).toBe(true);
        expect(result.has("B1")).toBe(true);
        expect(result.has("A")).toBe(false);
        expect(result.has("B")).toBe(false);
        expect(result.has("C")).toBe(false);
    });
});

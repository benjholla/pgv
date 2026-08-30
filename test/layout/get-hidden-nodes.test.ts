import { describe, it, expect } from "vitest";
import { getHiddenNodes } from "../../src/layout";

describe("getHiddenNodes", () => {
    it("should return empty set when no collapsed nodes", () => {
        const getChildren = () => [];
        const result = getHiddenNodes([], getChildren);
        expect(result.size).toBe(0);
    });

    it("should return empty set when collapsed nodes have no children", () => {
        const getChildren = () => [];
        const result = getHiddenNodes(["A", "B"], getChildren);
        expect(result.size).toBe(0);
    });

    it("should return all descendants of collapsed nodes", () => {
        const graph = new Map<string, string[]>([
            ["A", ["B", "C"]],
            ["B", ["D"]],
            ["C", []],
            ["D", ["E"]],
            ["E", []]
        ]);

        const getChildren = (id: string) => graph.get(id);

        const result = getHiddenNodes(["A"], getChildren);

        expect(result.size).toBe(4);
        expect(result.has("B")).toBe(true);
        expect(result.has("C")).toBe(true);
        expect(result.has("D")).toBe(true);
        expect(result.has("E")).toBe(true);
    });

    it("should correctly handle multiple collapsed nodes", () => {
        const graph = new Map<string, string[]>([
            ["A", ["B"]],
            ["B", []],
            ["C", ["D"]],
            ["D", []],
            ["E", ["F"]],
            ["F", []]
        ]);

        const getChildren = (id: string) => graph.get(id);

        const result = getHiddenNodes(["A", "C"], getChildren);

        expect(result.size).toBe(2);
        expect(result.has("B")).toBe(true);
        expect(result.has("D")).toBe(true);
        expect(result.has("F")).toBe(false);
    });

    it("should correctly handle overlapping descendants", () => {
        // Technically not a strict tree but containment relationships might be a DAG?
        // Let's assume it can be a DAG.
        const graph = new Map<string, string[]>([
            ["A", ["C"]],
            ["B", ["C", "D"]],
            ["C", []],
            ["D", []]
        ]);

        const getChildren = (id: string) => graph.get(id);

        const result = getHiddenNodes(["A", "B"], getChildren);

        expect(result.size).toBe(2);
        expect(result.has("C")).toBe(true);
        expect(result.has("D")).toBe(true);
    });
});

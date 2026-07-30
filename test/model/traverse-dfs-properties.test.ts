import { describe, it, expect, vi } from "vitest";
import { traverseDfs } from "../../src/model";

describe("traverseDfs Properties", () => {
    it("Reachability Property: visits all and only reachable nodes exactly once", () => {
        const graph = new Map<string, string[]>([
            ["A", ["B", "C"]],
            ["B", ["D"]],
            ["C", []],
            ["D", []],
            ["E", ["F"]], // Disconnected component
            ["F", []]
        ]);

        const getChildren = (id: string) => graph.get(id);

        let visitCount = 0;
        const visitedNodes: string[] = [];
        const onVisit = (id: string) => {
            visitCount++;
            visitedNodes.push(id);
        };

        const result = traverseDfs(["A"], getChildren, onVisit);

        expect(result.size).toBe(4);
        expect(result.has("A")).toBe(true);
        expect(result.has("B")).toBe(true);
        expect(result.has("C")).toBe(true);
        expect(result.has("D")).toBe(true);
        expect(result.has("E")).toBe(false);

        expect(visitCount).toBe(4);
        expect(new Set(visitedNodes)).toEqual(result);
    });

    it("Termination Property: handles cycles gracefully without infinite loops", () => {
        const graph = new Map<string, string[]>([
            ["A", ["B"]],
            ["B", ["C"]],
            ["C", ["A"]] // Cycle
        ]);

        const getChildren = (id: string) => graph.get(id);

        let visitCount = 0;
        const onVisit = vi.fn((id: string) => {
            visitCount++;
        });

        const result = traverseDfs(["A"], getChildren, onVisit);

        expect(result.size).toBe(3);
        expect(visitCount).toBe(3);
        expect(onVisit).toHaveBeenCalledTimes(3);
    });

    it("Empty Input Property: handles empty roots without errors", () => {
        const getChildren = () => [];
        const onVisit = vi.fn();
        const result = traverseDfs([], getChildren, onVisit);

        expect(result.size).toBe(0);
        expect(onVisit).not.toHaveBeenCalled();
    });

    it("Singleton Property: handles single node without children", () => {
        const getChildren = () => [];
        const onVisit = vi.fn();
        const result = traverseDfs(["A"], getChildren, onVisit);

        expect(result.size).toBe(1);
        expect(result.has("A")).toBe(true);
        expect(onVisit).toHaveBeenCalledTimes(1);
    });
});

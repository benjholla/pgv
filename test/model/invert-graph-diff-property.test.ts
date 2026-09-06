import { describe, it, expect } from "vitest";
import { createGraphSnapshot, createGraphDiff, invertGraphDiff, applyGraphDiff } from "../../src/model";

describe("invertGraphDiff involutory property", () => {
    it("inverting a diff, applying it, and inverting against intermediate strictly yields the original diff", () => {
        const base = createGraphSnapshot({
            nodes: [
                { id: "n1", tags: ["old"], attributes: { key: "val1" } },
                { id: "n2" }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n2", tags: ["link"] }
            ]
        });

        const diff = createGraphDiff({
            removedNodes: ["n1"],
            removedEdges: ["e1"],
            addedNodes: [
                { id: "n1", tags: ["new"], attributes: { key: "val2" } },
                { id: "n3" }
            ],
            addedEdges: [
                { id: "e2", source: "n1", target: "n3" }
            ]
        });

        // 1. Invert the diff against base
        const inverseDiff = invertGraphDiff(base, diff);

        // 2. Apply the original diff to base to get the intermediate state
        const intermediateState = applyGraphDiff(base, diff);

        // 3. Invert the inverse diff against the intermediate state
        const originalReconstructed = invertGraphDiff(intermediateState, inverseDiff);

        // 4. Expect originalReconstructed strictly equals diff
        expect(originalReconstructed.addedNodes.map(n => n.id).sort()).toEqual(diff.addedNodes.map(n => n.id).sort());
        expect(originalReconstructed.removedNodes.sort()).toEqual(diff.removedNodes.sort());
        expect(originalReconstructed.addedEdges.map(e => e.id).sort()).toEqual(diff.addedEdges.map(e => e.id).sort());
        expect(originalReconstructed.removedEdges.sort()).toEqual(diff.removedEdges.sort());

        for(let addedNode of diff.addedNodes) {
           const reconstructedNode = originalReconstructed.addedNodes.find(n => n.id === addedNode.id);
           expect(reconstructedNode).toBeDefined();
           expect(reconstructedNode?.tags).toEqual(addedNode.tags);
           expect(reconstructedNode?.attributes).toEqual(addedNode.attributes);
        }

        for(let addedEdge of diff.addedEdges) {
           const reconstructedEdge = originalReconstructed.addedEdges.find(e => e.id === addedEdge.id);
           expect(reconstructedEdge).toBeDefined();
           expect(reconstructedEdge?.source).toEqual(addedEdge.source);
           expect(reconstructedEdge?.target).toEqual(addedEdge.target);
           expect(reconstructedEdge?.tags).toEqual(addedEdge.tags);
           expect(reconstructedEdge?.attributes).toEqual(addedEdge.attributes);
        }
    });
});

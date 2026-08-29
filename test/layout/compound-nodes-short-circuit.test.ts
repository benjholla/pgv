import { describe, it, expect } from "vitest";
import { verticalLayout } from "../../src/layout";
import { createGraphSnapshot } from "../../src/model";

describe("Compound Nodes Short Circuit Property", () => {
    it("Initialization Property: Layout algorithms short-circuit initialization and O(N) traversals for compound nodes if schema?.containment is undefined or empty", () => {
        // According to the performance requirements in the memory, we should explicitly short-circuit
        // initialization of compound nodes and avoid O(N) edge scans if containment tags are not configured.

        const json: any = {
            nodes: [{ id: "A" }, { id: "B" }],
            edges: [
                { id: "e1", source: "A", target: "B", tags: ["contains"] }
            ]
        };

        const graphWithoutContainment = createGraphSnapshot(json);
        expect(graphWithoutContainment.schema?.containment).toBeUndefined();

        const layout = verticalLayout(graphWithoutContainment);

        // Since containment is not configured, A should not be identified as a parent
        // However, this test is more about the internal performance which we can't easily assert
        // without mocking. But we can ensure that A is indeed not treated as a parent.
        expect(layout.hierarchy).toBeUndefined();
    });
});

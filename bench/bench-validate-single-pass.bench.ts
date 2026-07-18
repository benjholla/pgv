import { bench, describe } from "vitest";

describe("validateStructuralInvariants single pass vs Array.from", () => {
  const edgeArray = [];
  for (let i = 0; i < 50000; i++) {
    edgeArray.push({ id: String(i), source: "1", target: "2", tags: ["a", "b"] });
  }
  const nodes = new Map([["1", {} as any], ["2", {} as any]]);
  const schema = { containment: ["a"] };

  function* generateEdges() {
    for (const e of edgeArray) {
        yield e;
    }
  }

  bench("Array.from(edges) two passes", () => {
    const edges = generateEdges();

    const edgeList = Array.from(edges);

    for (const edge of edgeList) {
      if (!nodes.has(edge.source)) throw new Error();
      if (!nodes.has(edge.target)) throw new Error();
    }

    const containmentAdjacency = new Map<string, string[]>();
    for (const nodeId of nodes.keys()) {
      containmentAdjacency.set(nodeId, []);
    }

    if (schema?.containment) {
      for (const edge of edgeList) {
        let isContainment = false;
        for (let i = 0; i < edge.tags.length; i++) {
          if (schema.containment.includes(edge.tags[i])) {
            isContainment = true;
            break;
          }
        }
        if (isContainment) {
          containmentAdjacency.get(edge.source)!.push(edge.target);
        }
      }
    }
  });

  bench("single pass (no array allocation)", () => {
    const edges = generateEdges();

    const containmentAdjacency = new Map<string, string[]>();
    for (const nodeId of nodes.keys()) {
      containmentAdjacency.set(nodeId, []);
    }

    for (const edge of edges) {
      if (!nodes.has(edge.source)) throw new Error();
      if (!nodes.has(edge.target)) throw new Error();

      if (schema?.containment) {
        let isContainment = false;
        for (let i = 0; i < edge.tags.length; i++) {
          if (schema.containment.includes(edge.tags[i])) {
            isContainment = true;
            break;
          }
        }
        if (isContainment) {
          containmentAdjacency.get(edge.source)!.push(edge.target);
        }
      }
    }
  });
});

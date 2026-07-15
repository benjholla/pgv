import { bench, describe } from "vitest";

const searchMode = "node-id";
const isAttributeModeSet = new Set(["node-attribute", "edge-attribute", "attribute"]);
const searchNodesSet = new Set(["all", "id", "node-id", "node-tag", "node-attribute", "tag", "attribute"]);
const searchEdgesSet = new Set(["all", "id", "edge-id", "edge-tag", "edge-attribute", "tag", "attribute"]);

describe("Search includes matching (individual)", () => {
  bench("current .includes (array literal) attribute", () => {
    return ["node-attribute", "edge-attribute", "attribute"].includes(searchMode);
  });

  bench("optimized .has (Set) attribute", () => {
    return isAttributeModeSet.has(searchMode);
  });

  bench("current .includes (array literal) nodes", () => {
    return ["all", "id", "node-id", "node-tag", "node-attribute", "tag", "attribute"].includes(searchMode);
  });

  bench("optimized .has (Set) nodes", () => {
    return searchNodesSet.has(searchMode);
  });
});

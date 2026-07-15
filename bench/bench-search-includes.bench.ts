import { bench, describe } from "vitest";

const searchMode = "node-id";
const isAttributeModeSet = new Set(["node-attribute", "edge-attribute", "attribute"]);
const searchNodesSet = new Set(["all", "id", "node-id", "node-tag", "node-attribute", "tag", "attribute"]);
const searchEdgesSet = new Set(["all", "id", "edge-id", "edge-tag", "edge-attribute", "tag", "attribute"]);

describe("Search includes matching", () => {
  bench("current .includes (array literal)", () => {
    const isAttributeMode = ["node-attribute", "edge-attribute", "attribute"].includes(searchMode);
    const searchNodes = ["all", "id", "node-id", "node-tag", "node-attribute", "tag", "attribute"].includes(searchMode);
    const searchEdges = ["all", "id", "edge-id", "edge-tag", "edge-attribute", "tag", "attribute"].includes(searchMode);
    return isAttributeMode && searchNodes && searchEdges;
  });

  bench("optimized .has (Set)", () => {
    const isAttributeMode = isAttributeModeSet.has(searchMode);
    const searchNodes = searchNodesSet.has(searchMode);
    const searchEdges = searchEdgesSet.has(searchMode);
    return isAttributeMode && searchNodes && searchEdges;
  });
});

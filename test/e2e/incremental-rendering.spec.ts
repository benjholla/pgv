import { test, expect, type Page } from "@playwright/test";
import type { GraphSnapshotJson, GraphDiffJson } from "../../src/model";

async function injectGraph(page: Page, graphJson: GraphSnapshotJson) {
  await page.evaluate((json: GraphSnapshotJson) => {
    (window as unknown as { __setTestGraph: (json: GraphSnapshotJson) => void }).__setTestGraph(json);
  }, graphJson);
  await page.waitForTimeout(500);
}

async function applyGraphDiff(page: Page, diffJson: GraphDiffJson) {
  await page.evaluate((json: GraphDiffJson) => {
    (window as unknown as { __applyGraphDiff: (json: GraphDiffJson) => void }).__applyGraphDiff(json);
  }, diffJson);
  await page.waitForTimeout(1000);
}

test.describe("Incremental GraphDiff Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#graph", { timeout: 10000 });
  });

  test("Applying sequential diffs matches full snapshot layout", async ({ page }) => {
    const initialGraph = {
      nodes: [
        { id: "1", tags: [], attributes: { "XCSG.name": "Node 1" } }
      ],
      edges: []
    };

    const diff1 = {
      addedNodes: [{ id: "2", tags: [], attributes: { "XCSG.name": "Node 2" } }],
      removedNodes: [],
      addedEdges: [{ id: "e1", source: "1", target: "2", tags: [], attributes: {} }],
      removedEdges: []
    };

    const diff2 = {
      addedNodes: [{ id: "3", tags: [], attributes: { "XCSG.name": "Node 3" } }],
      removedNodes: [],
      addedEdges: [{ id: "e2", source: "2", target: "3", tags: [], attributes: {} }],
      removedEdges: []
    };

    const fullGraphAfterDiff2 = {
      nodes: [
        { id: "1", tags: [], attributes: { "XCSG.name": "Node 1" } },
        { id: "2", tags: [], attributes: { "XCSG.name": "Node 2" } },
        { id: "3", tags: [], attributes: { "XCSG.name": "Node 3" } }
      ],
      edges: [
        { id: "e1", source: "1", target: "2", tags: [], attributes: {} },
        { id: "e2", source: "2", target: "3", tags: [], attributes: {} }
      ]
    };

    await injectGraph(page, initialGraph);
    await applyGraphDiff(page, diff1);
    await applyGraphDiff(page, diff2);

    const canvas = page.locator("#graph");

    // Check against baseline on disk
    await expect(canvas).toHaveScreenshot("incremental-linear-diff.png", {
      maxDiffPixels: 100,
    });
  });

  test("Rendering full snapshot directly matches incremental", async ({ page }) => {
    const fullGraphAfterDiff2 = {
      nodes: [
        { id: "1", tags: [], attributes: { "XCSG.name": "Node 1" } },
        { id: "2", tags: [], attributes: { "XCSG.name": "Node 2" } },
        { id: "3", tags: [], attributes: { "XCSG.name": "Node 3" } }
      ],
      edges: [
        { id: "e1", source: "1", target: "2", tags: [], attributes: {} },
        { id: "e2", source: "2", target: "3", tags: [], attributes: {} }
      ]
    };

    // Now render full graph from scratch
    await injectGraph(page, fullGraphAfterDiff2);

    const canvas = page.locator("#graph");

    // Check against the EXACT SAME baseline on disk
    await expect(canvas).toHaveScreenshot("incremental-linear-diff.png", {
      maxDiffPixels: 100,
    });
  });
});

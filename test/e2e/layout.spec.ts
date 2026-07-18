import { test, expect } from "@playwright/test";

// Helper script to inject graph JSON into the demo app
async function injectGraph(page: any, graphJson: any) {
  await page.evaluate((json: any) => {
    (window as any).__setTestGraph(json);
  }, graphJson);

  // Wait a small amount of time for render
  await page.waitForTimeout(500);
}

test.describe("Graph Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root (which is the static-tester app)
    await page.goto("/");
    // We don't really need to ensure a default graph rendered if we are just going to overwrite it
    // Wait for the container to be ready at least
    await page.waitForSelector("#graph", { timeout: 10000 });
  });

  test("Default sample graph layout", async ({ page }) => {
    // Give it a brief moment to ensure fonts/initial render are complete
    await page.waitForTimeout(1000);
    const canvas = page.locator("#graph");
    await expect(canvas).toHaveScreenshot("layout-default.png", {
      maxDiffPixels: 100, // Account for minor font anti-aliasing diffs across envs
    });
  });

  test("Simple linear flow", async ({ page }) => {
    await injectGraph(page, {
      nodes: [
        { id: "1", attributes: { "XCSG.name": "Start" } },
        { id: "2", attributes: { "XCSG.name": "Step 1" } },
        { id: "3", attributes: { "XCSG.name": "End" } },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    });

    const canvas = page.locator("#graph");
    await expect(canvas).toHaveScreenshot("layout-linear.png", {
      maxDiffPixels: 100,
    });
  });

  test("Diamond dependency structure", async ({ page }) => {
    await injectGraph(page, {
      nodes: [
        { id: "A", attributes: { "XCSG.name": "A" } },
        { id: "B", attributes: { "XCSG.name": "B" } },
        { id: "C", attributes: { "XCSG.name": "C" } },
        { id: "D", attributes: { "XCSG.name": "D" } },
      ],
      edges: [
        { id: "e1", source: "A", target: "B" },
        { id: "e2", source: "A", target: "C" },
        { id: "e3", source: "B", target: "D" },
        { id: "e4", source: "C", target: "D" },
      ],
    });

    const canvas = page.locator("#graph");
    await expect(canvas).toHaveScreenshot("layout-diamond.png", {
      maxDiffPixels: 100,
    });
  });

  test("Wide fan-out structure", async ({ page }) => {
    await injectGraph(page, {
      nodes: [
        { id: "Root", attributes: { "XCSG.name": "Root" } },
        { id: "C1", attributes: { "XCSG.name": "Child 1" } },
        { id: "C2", attributes: { "XCSG.name": "Child 2" } },
        { id: "C3", attributes: { "XCSG.name": "Child 3" } },
        { id: "C4", attributes: { "XCSG.name": "Child 4" } },
        { id: "C5", attributes: { "XCSG.name": "Child 5" } },
      ],
      edges: [
        { id: "e1", source: "Root", target: "C1" },
        { id: "e2", source: "Root", target: "C2" },
        { id: "e3", source: "Root", target: "C3" },
        { id: "e4", source: "Root", target: "C4" },
        { id: "e5", source: "Root", target: "C5" },
      ],
    });

    const canvas = page.locator("#graph");
    await expect(canvas).toHaveScreenshot("layout-wide.png", {
      maxDiffPixels: 100,
    });
  });

  test("Compound nodes structure", async ({ page }) => {
    await injectGraph(page, {
      schema: {
        containment: ["contains"]
      },
      nodes: [
        { id: "Parent", attributes: { "XCSG.name": "Parent" } },
        { id: "Child1", attributes: { "XCSG.name": "Child 1" } },
        { id: "Child2", attributes: { "XCSG.name": "Child 2" } },
        { id: "External", attributes: { "XCSG.name": "External" } }
      ],
      edges: [
        { id: "e1", source: "Parent", target: "Child1", tags: ["contains"] },
        { id: "e2", source: "Parent", target: "Child2", tags: ["contains"] },
        { id: "e3", source: "Child1", target: "Child2" },
        { id: "e4", source: "Child2", target: "External" }
      ],
    });

    const canvas = page.locator("#graph");
    await expect(canvas).toHaveScreenshot("layout-compound.png", {
      maxDiffPixels: 100,
    });
  });

});

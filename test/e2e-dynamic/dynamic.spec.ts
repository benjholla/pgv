import { test, expect } from "@playwright/test";

test.describe("Dynamic Example Flow", () => {
  // Use a custom setup for just this file to hit the dynamic dev server instead of the tester server
  test.use({ baseURL: "http://127.0.0.1:5173" });

  test("Loads graph from spring boot backend successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the graph container to be ready
    await page.waitForSelector("#graph", { timeout: 10000 });

    // Wait until the summary shows node and edge count
    const summary = page.locator("#graph-summary");
    await expect(summary).toContainText("nodes", { timeout: 10000 });
    await expect(summary).toContainText("edges", { timeout: 10000 });

    // Check that we got the right counts
    await expect(summary).toHaveText("7 nodes, 12 edges");

    // Check that elements with the expected names are rendered in the DOM
    const graphText = await page.locator("#graph").innerText();
    expect(graphText).toContain("Entry");
    expect(graphText).toContain("Initialize i = 0");
    expect(graphText).toContain("Foo");
  });
});

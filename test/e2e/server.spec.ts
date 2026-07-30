import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.describe("Server Side SVG Rendering", () => {
  let cssText: string;
  let renderGraphToSvg: any;
  let createGraphSnapshot: any;

  test.beforeAll(async () => {
    const cssPath = path.resolve(process.cwd(), "src/style.css");
    cssText = fs.readFileSync(cssPath, "utf-8");
    const module = await import("../../dist/index.js");
    renderGraphToSvg = module.renderGraphToSvg;
    createGraphSnapshot = module.createGraphSnapshot;
  });

  async function injectServerSvg(page: any, graphJson: any, name: string) {
    const snapshot = createGraphSnapshot(graphJson);
    const svgStr = renderGraphToSvg(snapshot, graphJson.schema || {}, { usePanZoom: false, theme: "light" }, cssText);

    // Inject the raw SVG string directly into the body
    await page.setContent(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Server SVG Test</title>
    <style>
      body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    ${svgStr}
  </body>
</html>`);

    // Give it a brief moment to ensure fonts/initial render are complete
    await page.waitForTimeout(1000);
  }

  test("Simple linear flow server side", async ({ page }) => {
    await injectServerSvg(page, {
      nodes: [
        { id: "1", attributes: { "XCSG.name": "Start" } },
        { id: "2", attributes: { "XCSG.name": "Step 1" } },
        { id: "3", attributes: { "XCSG.name": "End" } },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    }, "linear");

    // We can compare against the same layout snapshots from client
    const canvas = page.locator("svg");
    await expect(canvas).toHaveScreenshot("layout-linear.png", {
      maxDiffPixels: 200,
    });
  });

  test("Diamond dependency structure server side", async ({ page }) => {
    await injectServerSvg(page, {
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
    }, "diamond");

    const canvas = page.locator("svg");
    await expect(canvas).toHaveScreenshot("layout-diamond.png", {
      maxDiffPixels: 200,
    });
  });

  test("Wide fan-out structure server side", async ({ page }) => {
    await injectServerSvg(page, {
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
    }, "wide");

    const canvas = page.locator("svg");
    await expect(canvas).toHaveScreenshot("layout-wide.png", {
      maxDiffPixels: 200,
    });
  });

  test("Compound nodes structure server side", async ({ page }) => {
    await injectServerSvg(page, {
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
    }, "compound");

    const canvas = page.locator("svg");
    await expect(canvas).toHaveScreenshot("layout-compound.png", {
      maxDiffPixels: 200,
    });
  });

});

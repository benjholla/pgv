import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Foo node does not disappear on child collapse', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');

  // Wait for graph to render
  await page.waitForSelector('.pgv-graph-node');

  let fooNode = await page.$('.pgv-compound-node[data-node-id="Foo"]');
  console.log("Foo exists before collapse:", !!fooNode);
  if (fooNode) {
    const box = await fooNode.boundingBox();
    console.log("Foo bbox before:", box);
  }

  // Find the condition node's collapse button
  // The condition node is "condition"
  const conditionNode = await page.$('.pgv-graph-node[data-node-id="condition"]');
  console.log("Condition exists:", !!conditionNode);

  if (conditionNode) {
    const collapseBtn = await conditionNode.$('.pgv-node-collapse-toggle');
    console.log("Collapse btn exists:", !!collapseBtn);
    if (collapseBtn) {
      await collapseBtn.click();
      await page.waitForTimeout(500); // Wait for re-render
    }
  }

  fooNode = await page.$('.pgv-compound-node[data-node-id="Foo"]');
  console.log("Foo exists after collapse:", !!fooNode);
  expect(fooNode).not.toBeNull();
  if (fooNode) {
    const box = await fooNode.boundingBox();
    console.log("Foo bbox after:", box);
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  }
});

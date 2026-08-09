import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GraphView } from "../../src/renderer";
import { createGraphSnapshot, GraphSnapshotJson } from "../../src/model";
import { verticalLayout } from "../../src/layout";

describe('Dropdown Keyboard Navigation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.getBoundingClientRect = vi.fn(() => ({
      width: 1000, height: 800, top: 0, left: 0, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => {}
    }));
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('navigates dropdown options with keyboard', async () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: [], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, useThemeToggle: true, theme: 'light' });
    view.setGraph(snapshot);

    await new Promise(resolve => setTimeout(resolve, 350));

    const downloadDropdownBtn = container.querySelector(".pgv-download-dropdown-btn") as HTMLButtonElement;
    expect(downloadDropdownBtn).toBeDefined();

    downloadDropdownBtn.click();

    const dropdownMenu = container.querySelector("#pgv-download-dropdown-menu.open") as HTMLElement;
    expect(dropdownMenu).toBeDefined();
    expect(dropdownMenu).not.toBeNull();

    const options = dropdownMenu.querySelectorAll(".pgv-dropdown-option");
    expect(options.length).toBeGreaterThan(1);

    const firstOption = options[0] as HTMLElement;
    const secondOption = options[1] as HTMLElement;
    const lastOption = options[options.length - 1] as HTMLElement;

    let clicked = false;
    secondOption.addEventListener('click', () => { clicked = true; });

    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(secondOption);

    secondOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(firstOption);

    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(lastOption);

    lastOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(firstOption);

    secondOption.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clicked).toBe(true);

    view.destroy();
  });
});

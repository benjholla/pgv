import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, GraphSnapshotJson } from '../../src/model';
import { verticalLayout } from '../../src/layout';

describe('GraphView - Advanced Interaction Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.getBoundingClientRect = vi.fn(() => ({
      width: 1000,
      height: 800,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
    document.body.appendChild(container);

    // Provide a dummy mock for SVGImageElement for jsdom
    if (typeof global.SVGImageElement === 'undefined') {
        (global as any).SVGImageElement = class SVGImageElement {};
    }
  });

  const waitForRender = async () => {
      // Use fake timers to fast forward through requestAnimationFrame and setTimeouts
      // which allows deterministic testing without true sleep.
      // But in this particular component, requestAnimationFrame is used for batching.
      // So we can mock rAF or just wait for DOM updates using vi.waitFor or simple promise resolution.
      await new Promise(resolve => setTimeout(resolve, 50));
  };

  it('verifies search advanced options toggles', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }, { id: "node2", tags: ["B"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    await waitForRender();

    const searchToggleBtn = container.querySelector('button[title="Toggle Search"]') as HTMLButtonElement;
    searchToggleBtn.click();

    const searchInput = container.querySelector('.pgv-search-input-wrapper input') as HTMLInputElement;

    searchInput.value = "Node";
    searchInput.dispatchEvent(new Event('input'));

    const caseSensitiveBtn = container.querySelector('button[title="Match Case"]') as HTMLButtonElement;
    caseSensitiveBtn.click();

    let searchBtn = container.querySelector('button[title="Search"]') as HTMLButtonElement;
    searchBtn.click();

    let resultInfo = container.querySelector('.pgv-search-results-info');
    expect(resultInfo?.textContent).toContain("1 of 1"); // Node1

    const exactBtn = container.querySelector('button[title="Match Whole Word"]') as HTMLButtonElement;
    exactBtn.click();

    searchInput.value = "Node1";
    searchInput.dispatchEvent(new Event('input'));

    searchBtn = container.querySelector('button[title="Search"]') as HTMLButtonElement;
    searchBtn.click();
    resultInfo = container.querySelector('.pgv-search-results-info');
    expect(resultInfo?.textContent).toContain("1 of 1");

    const regexBtn = container.querySelector('button[title="Use Regular Expression"]') as HTMLButtonElement;
    regexBtn.click();

    searchInput.value = "N.*1";
    searchInput.dispatchEvent(new Event('input'));

    searchBtn = container.querySelector('button[title="Search"]') as HTMLButtonElement;
    searchBtn.click();

    resultInfo = container.querySelector('.pgv-search-results-info');
    expect(resultInfo?.textContent).toContain("1 of 1");

    view.destroy();
  });

  it('verifies search clear functionality', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    await waitForRender();

    const searchToggleBtn = container.querySelector('button[title="Toggle Search"]') as HTMLButtonElement;
    searchToggleBtn.click();

    const searchInput = container.querySelector('.pgv-search-input-wrapper input') as HTMLInputElement;

    searchInput.value = "Node1";
    searchInput.dispatchEvent(new Event('input'));

    const activeClearBtn = container.querySelector('.pgv-search-clear-btn') as HTMLButtonElement;
    activeClearBtn.click();

    expect(searchInput.value).toBe("");

    view.destroy();
  });

  it('verifies search dropdown keyboard navigation', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    await waitForRender();

    const searchToggleBtn = container.querySelector('button[title="Toggle Search"]') as HTMLButtonElement;
    searchToggleBtn.click();

    const dropdownBtn = container.querySelector('.pgv-search-dropdown-btn') as HTMLButtonElement;
    dropdownBtn.click();

    // Document click should close
    document.dispatchEvent(new MouseEvent('click'));
    expect(container.querySelector('.pgv-dropdown-menu')?.classList.contains('open')).toBeFalsy();

    dropdownBtn.click();
    let option = container.querySelector('.pgv-dropdown-option') as HTMLDivElement;
    option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.pgv-dropdown-menu')?.classList.contains('open')).toBeFalsy();

    dropdownBtn.click();
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.pgv-dropdown-menu')?.classList.contains('open')).toBeFalsy();

    dropdownBtn.click();
    option = container.querySelector('.pgv-dropdown-option') as HTMLDivElement;
    option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(container.querySelector('.pgv-dropdown-menu')?.classList.contains('open')).toBeFalsy();

    view.destroy();
  });

  it('verifies download formatting JSON via dropdown', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true, useDownload: true });
    view.setGraph(snapshot);

    await waitForRender();

    const dropdownBtn = container.querySelector('.pgv-download-dropdown-btn') as HTMLButtonElement;
    expect(dropdownBtn).not.toBeNull();
    dropdownBtn.click();

    const jsonOption = container.querySelector('.pgv-dropdown-option[data-value="json"]') as HTMLDivElement;
    jsonOption.click();

    view.destroy();
  });

  it('verifies fullscreen toggling', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    await waitForRender();

    Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true, configurable: true });
    Object.defineProperty(document, 'exitFullscreen', { value: vi.fn(() => Promise.resolve()), writable: true, configurable: true });
    container.requestFullscreen = vi.fn(() => Promise.resolve());

    const fullscreenBtn = container.querySelector('button[title="Enter Fullscreen"]') as HTMLButtonElement;
    expect(fullscreenBtn).not.toBeNull();
    await fullscreenBtn.click();

    expect(container.requestFullscreen).toHaveBeenCalled();

    Object.defineProperty(document, 'fullscreenElement', { value: container, writable: true, configurable: true });
    await fullscreenBtn.click();
    expect(document.exitFullscreen).toHaveBeenCalled();

    view.destroy();
  });

  it('verifies minimap event handling', async () => {
    // Mock ResizeObserver
    let observerCallback: any = null;
    global.ResizeObserver = class ResizeObserver {
        constructor(cb: any) { observerCallback = cb; }
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }, { id: "Node2", tags: ["A"], attributes: {} }],
      edges: [{ id: "e1", source: "Node1", target: "Node2" }]
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true, controlsCollapsed: false });

    view.setGraph(snapshot);
    await waitForRender();

    const toggleMapBtn = container.querySelector('button[title="Toggle Minimap"]') as HTMLButtonElement;
    expect(toggleMapBtn).not.toBeNull();
    toggleMapBtn.click();

    await waitForRender();

    const minimap = container.querySelector('.pgv-minimap') as HTMLDivElement;

    minimap.setPointerCapture = vi.fn();
    minimap.releasePointerCapture = vi.fn();

    minimap.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10, button: 0, pointerType: 'mouse', pointerId: 1 }));
    minimap.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 20, pointerId: 1 }));
    minimap.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));

    if (observerCallback) {
        observerCallback();
    }

    view.destroy();
  });

  it('verifies JSON download behavior', async () => {
    const createObjectURLSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.fn();
    const mockAnchor = { href: '', download: '', click: clickSpy, style: {} };

    const originalCreateElement = document.createElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
            return mockAnchor as any;
        }
        return originalCreateElement.call(document, tagName);
    });

    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true, useDownload: true });
    view.setGraph(snapshot);

    await waitForRender();

    const dropdownBtn = container.querySelector('.pgv-download-dropdown-btn') as HTMLButtonElement;
    dropdownBtn.click();
    const jsonOption = container.querySelector('.pgv-dropdown-option[data-value="json"]') as HTMLDivElement;
    jsonOption.click();

    const downloadBtn = container.querySelector('.pgv-download-action-btn') as HTMLButtonElement;
    downloadBtn.click();

    await waitForRender();
    expect(clickSpy).toHaveBeenCalled();

    view.destroy();
    createElementSpy.mockRestore();
  });

  it('verifies dropdown keyboard edge cases', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "Node1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    await waitForRender();

    const searchToggleBtn = container.querySelector('button[title="Toggle Search"]') as HTMLButtonElement;
    searchToggleBtn.click();

    const dropdownBtn = container.querySelector('.pgv-search-dropdown-btn') as HTMLButtonElement;
    dropdownBtn.click();

    // Verify arrow navigation wrapping
    const firstOption = container.querySelector('.pgv-dropdown-option:first-child') as HTMLDivElement;
    const lastOption = container.querySelector('.pgv-dropdown-option:last-child') as HTMLDivElement;

    // Arrow Up on first option should wrap to last
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    // Arrow Down on last option should wrap to first
    lastOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    // Edge cases for Home/End
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));

    view.destroy();
  });
});

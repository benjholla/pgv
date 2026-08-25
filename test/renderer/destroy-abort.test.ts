import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, GraphSnapshotJson } from '../../src/model';
import { verticalLayout } from '../../src/layout';

describe('GraphView Destroy AbortController Properties', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    global.ResizeObserver = class ResizeObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
    } as any;
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('Resource Cleanup Property: Calling destroy aborts all AbortControllers, including search', async () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: [], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true, useThemeToggle: true, useDownload: true, controlsCollapsed: false });
    view.setGraph(snapshot);

    // We must wait for render so elements exist
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    // Spy on abort
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    // Trigger actions to instantiate AbortControllers
    const searchToggleBtn = container.querySelector('button[title="Toggle Search"]') as HTMLButtonElement;
    if (searchToggleBtn) searchToggleBtn.click();
    await new Promise(r => requestAnimationFrame(r));

    const searchDropdownBtn = container.querySelector('.pgv-search-dropdown-btn') as HTMLButtonElement;
    if (searchDropdownBtn) searchDropdownBtn.click();

    const downloadDropdownBtn = container.querySelector('.pgv-download-dropdown-btn') as HTMLButtonElement;
    if (downloadDropdownBtn) downloadDropdownBtn.click();

    const minimapToggleBtn = container.querySelector('button[title="Toggle Minimap"]') as HTMLButtonElement;
    if (minimapToggleBtn) minimapToggleBtn.click();

    const smartDropdownBtn = container.querySelector('.pgv-smart-dropdown-btn') as HTMLButtonElement;
    if (smartDropdownBtn) smartDropdownBtn.click();


    view.destroy();

    expect(abortSpy).toHaveBeenCalled();
    // Verify that at least 5 calls were made
    expect(abortSpy.mock.calls.length).toBeGreaterThanOrEqual(5);
  });
});

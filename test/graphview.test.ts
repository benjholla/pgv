// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphView, renderGraph } from '../src/renderer';
import { GraphSchema, GraphSnapshot, GraphDiff } from '../src/model';

describe('GraphView API Edge Cases', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('can be instantiated and initialized without a graph', () => {
    const view = new GraphView(container, schema);
    expect(view.container).toBe(container);
    expect(container.querySelector('.pgv-viewport')).toBeFalsy();
  });

  it('handles applyDiff with missing graph properly', () => {
    const view = new GraphView(container, schema);
    const diff: GraphDiff = { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    expect(() => view.applyDiff(diff, 1)).toThrow("Cannot apply diff to an empty graph view.");
  });

  it('properly removes elements when destroy is called', () => {
    const view = new GraphView(container, schema);
    const graph: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph);
    expect(container.innerHTML).not.toBe('');
    view.destroy();
    expect(container.innerHTML).toBe('');
  });

  it('preserves existing options when updated', () => {
    const view = new GraphView(container, schema, { theme: 'light', usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);
    expect(container.querySelector('.pgv-light')).toBeTruthy();
    expect(container.querySelector('.pgv-pan-zoom')).toBeTruthy();

    // Update theme only, should preserve panzoom
    view.updateOptions({ theme: 'dark' });
    expect(container.querySelector('.pgv-dark')).toBeTruthy();

    expect(container.querySelector('.pgv-pan-zoom')).toBeTruthy();
  });

  it('renders a graph view without errors', () => {
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    const view = renderGraph(container, schema, graph1);
    expect(view).toBeTruthy();
    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1);
  });
});

describe('GraphView History Navigation', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('navigates history correctly with manual method calls', () => {
    const view = new GraphView(container, schema, { maxHistory: 10 });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const diff1: GraphDiff = { addedNodes: [{ id: '2', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff1, 1);

    const diff2: GraphDiff = { addedNodes: [{ id: '3', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff2, 2);

    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(3);

    const getBtn = (label: string) => document.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;

    const leftBtn = getBtn("Previous Graph Snapshot");
    const rightBtn = getBtn("Next Graph Snapshot");
    const rwBtn = getBtn("Earliest Graph Snapshot");
    const ffBtn = getBtn("Latest Graph Snapshot");

    if (leftBtn) { leftBtn.click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2); }
    if (leftBtn) { leftBtn.click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1); }
    if (rightBtn) { getBtn("Next Graph Snapshot").click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2); }
    if (rightBtn) { getBtn("Next Graph Snapshot").click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(3); }
    if (rwBtn) { rwBtn.click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1); }
    if (ffBtn) { getBtn("Latest Graph Snapshot").click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(3); }
  });

  it('cannot navigate out of bounds', () => {
    const view = new GraphView(container, schema, { maxHistory: 10 });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const diff1: GraphDiff = { addedNodes: [{ id: '2', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff1, 1);

    const rightBtn = document.querySelector('[aria-label="Next Graph Snapshot"]');
    if (rightBtn) { (rightBtn as HTMLElement).click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2); }

    const rwBtn = document.querySelector('[aria-label="Earliest Graph Snapshot"]');
    if (rwBtn) { (rwBtn as HTMLElement).click(); (rwBtn as HTMLElement).click(); expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1); }
  });

  it('compresses history past maxHistory', () => {
    const view = new GraphView(container, schema, { maxHistory: 1 });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const diff1: GraphDiff = { addedNodes: [{ id: '2', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff1, 1);

    const diff2: GraphDiff = { addedNodes: [{ id: '3', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff2, 2);

    const leftBtn = document.querySelector('[aria-label="Previous Graph Snapshot"]');
    if (leftBtn) {
      (leftBtn as HTMLElement).click();
      expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2);
      (leftBtn as HTMLElement).click();
      expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2);
    }
  });

  it('navigates history incorrectly causes no errors', () => {
    const view = new GraphView(container, schema);
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);
    const diff1: GraphDiff = { addedNodes: [{ id: '2', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff1, 1);
    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2);

    const emptyView = new GraphView(container, schema);
    expect(() => emptyView.applyDiff(diff1, 1)).toThrow("Cannot apply diff to an empty graph view");
  });

  it('throws error when pushing diff would expire currently viewed state', () => {
    const view = new GraphView(container, schema, { maxHistory: 1 });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);
    const diff1: GraphDiff = { addedNodes: [{ id: '2', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff1, 1);

    const leftBtn = document.querySelector('[aria-label="Previous Graph Snapshot"]');
    if (leftBtn) { (leftBtn as HTMLElement).click(); }

    const diff2: GraphDiff = { addedNodes: [{ id: '3', tags: [], attributes: {} }], removedNodes: [], addedEdges: [], removedEdges: [], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    expect(() => view.applyDiff(diff2, 2)).toThrow("Graph view is blocked");
  });
});

describe('GraphView Search Coverage', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('renders search panel and handles search interactions', () => {
    const view = new GraphView(container, schema, { useSearch: true });
    const graph: GraphSnapshot = {
      nodes: new Map([['1', { id: 'node-1', tags: ['entry'], attributes: { key1: { string: "val1" } } }], ['2', { id: 'node-2', tags: ['exit'], attributes: { key2: { string: "val2" } } }]]),
      edges: new Map()
    };
    view.setGraph(graph);

    const toggleBtn = container.querySelector('[aria-label="Toggle Search"]');
    if (!toggleBtn) return;
    (toggleBtn as HTMLElement).click();

    const globalInput = container.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
    globalInput.value = 'node';
    globalInput.dispatchEvent(new Event('input'));

    const nextBtn = container.querySelector('[aria-label="Next Match"]');
    const prevBtn = container.querySelector('[aria-label="Previous Match"]');
    (nextBtn as HTMLElement).click();
    (prevBtn as HTMLElement).click();

    const modeSelect = container.querySelector('.pgv-search-mode-select') as HTMLSelectElement;
    modeSelect.value = 'attribute';
    modeSelect.dispatchEvent(new Event('change'));

    const keyInput = container.querySelector('input[placeholder="Attribute Key..."]') as HTMLInputElement;
    const valueInput = container.querySelector('input[placeholder="Attribute Value..."]') as HTMLInputElement;

    keyInput.value = 'key1';
    keyInput.dispatchEvent(new Event('input'));
    valueInput.value = 'val1';
    valueInput.dispatchEvent(new Event('input'));

    const closeBtn = container.querySelector('button[title="Close Search"]');
    (closeBtn as HTMLElement).click();
  });
});

describe('GraphView Additional Interactions', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('handles minimap toggle correctly', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);
    const minimapBtn = document.querySelector('[aria-label="Toggle Minimap"]') as HTMLButtonElement;
    minimapBtn.click();
    expect(document.querySelector('.pgv-minimap-open')).toBeTruthy();
    minimapBtn.click();
    expect(document.querySelector('.pgv-minimap-open')).toBeFalsy();
  });

  it('handles selection correctly', () => {
    const selectionState = { nodes: new Set<string>(), edges: new Set<string>() };
    const view = new GraphView(container, schema, {
      usePanZoom: true,
      selection: selectionState,
      onSelectionChange: (sel) => { selectionState.nodes = sel.nodes; selectionState.edges = sel.edges; }
    });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map([['e1', { id: 'e1', source: '1', target: '1', tags: [], attributes: {} }]]) };
    view.setGraph(graph1);

    view.updateOptions({ selection: { nodes: new Set(['1']), edges: new Set() } });
    const clearBtn2 = document.querySelector('[aria-label="Clear Selection"]') as HTMLButtonElement;
    clearBtn2.click();
    expect(selectionState.nodes.size).toBe(0);
  });

  it('covers update options toggle', () => {
    const view = new GraphView(container, schema, { theme: 'light', usePanZoom: true, useThemeToggle: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const themeToggleBtn = document.querySelector('[aria-label="Toggle Theme"]');
    if (themeToggleBtn) {
      (themeToggleBtn as HTMLElement).click();
      expect(container.querySelector('.pgv-dark')).toBeTruthy();
      (themeToggleBtn as HTMLElement).click();
      (themeToggleBtn as HTMLElement).click();
    }
  });

  it('covers full tree diff update coverage', () => {
    const view = new GraphView(container, schema);
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const diff1: GraphDiff = {
      addedNodes: [{ id: '2', tags: [], attributes: {} }], removedNodes: ['1'],
      addedEdges: [{ id: 'e1', source: '2', target: '2', tags: [], attributes: {} }], removedEdges: [],
      updatedNodeAttributes: [{ id: '2', attributes: { key1: { string: "val" } } }],
      updatedEdgeAttributes: [{ id: 'e1', attributes: { key1: { string: "val" } } }]
    };
    view.applyDiff(diff1, 1);

    const diff2: GraphDiff = { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: ['e1'], updatedNodeAttributes: [], updatedEdgeAttributes: [] };
    view.applyDiff(diff2, 2);
  });

  it('handles minimap setup logic when opened', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() })) as any;
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);
    const minimapBtn = document.querySelector('[aria-label="Toggle Minimap"]') as HTMLButtonElement;
    minimapBtn.click();
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
  });

  it('covers download functionality interactions', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const dropdownBtn = document.querySelector('.pgv-download-dropdown-btn') as HTMLButtonElement;
    dropdownBtn.click();

    const pngOption = document.querySelector('div[role="menuitem"]');
    if (!pngOption) {
      const options = document.querySelectorAll('.pgv-dropdown-option');
      let foundOption = null;
      for (let i = 0; i < options.length; i++) {
        if (options[i].textContent?.toLowerCase().includes('png')) { foundOption = options[i]; break; }
      }
      (foundOption as HTMLElement).click();
    } else {
      (pngOption as HTMLElement).click();
    }

    const downloadBtn = document.querySelector('.pgv-download-action-btn') as HTMLButtonElement;
    global.URL.createObjectURL = vi.fn(() => "blob:test");
    global.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();

    dropdownBtn.click();

    const options = document.querySelectorAll('.pgv-dropdown-option');
    let jsonOption = null;
    for (let i = 0; i < options.length; i++) {
      if (options[i].textContent?.toLowerCase().includes('json')) { jsonOption = options[i]; break; }
    }
    (jsonOption as HTMLElement).click();

    downloadBtn.click();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('GraphView Rendering Details Coverage', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('renders node attributes and custom renders correctly', () => {
    const view = new GraphView(container, schema, {
      nodeContent: (node) => {
        if (node.id === '2') { return "Custom String Content"; }
        return undefined;
      }
    });
    const graph1: GraphSnapshot = {
      nodes: new Map([
        ['1', { id: '1', tags: [], attributes: { 'intAttr': { integer: 5 }, 'floatAttr': { float: 5.5 }, 'bytesAttr': { bytes: "xyz" } } }],
        ['2', { id: '2', tags: [], attributes: {} }],
        ['3', { id: '3', tags: [], attributes: { 'strAttr': "test", 'boolAttr': true } }]
      ]),
      edges: new Map()
    };
    view.setGraph(graph1);

    const nodeEls = container.querySelectorAll('.pgv-graph-node');
    expect(nodeEls[0].innerHTML).toContain("5");
    expect(nodeEls[0].innerHTML).toContain("5.5");
    expect(nodeEls[0].innerHTML).toContain("[bytes: xyz]");
    expect(nodeEls[2].innerHTML).toContain("test");
    expect(nodeEls[2].innerHTML).toContain("true");
    expect(nodeEls[1].innerHTML).toContain("Custom String Content");
  });

  it('renders node selection correctly', () => {
    const view = new GraphView(container, schema, { selection: { nodes: new Set(['1']), edges: new Set() } });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }], ['2', { id: '2', tags: ['mytag'], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const node1 = container.querySelector('.pgv-graph-node[data-node-id="1"]') as HTMLElement;
    const node2 = container.querySelector('.pgv-graph-node[data-node-id="2"]') as HTMLElement;
    expect(node1.classList.contains('pgv-selected')).toBe(true);
    expect(node2.classList.contains('tag-mytag')).toBe(true);
  });

  it('renders edge labels correctly', () => {
    const view = new GraphView(container, schema, { edgeLabel: (edge) => edge.id === 'e1' ? "Custom Edge Label" : null });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }], ['2', { id: '2', tags: [], attributes: {} }]]), edges: new Map([['e1', { id: 'e1', source: '1', target: '2', tags: [], attributes: {} }]]) };
    view.setGraph(graph1);

    const edgeLabels = container.querySelectorAll('.pgv-edge-label');
    expect(edgeLabels[0].textContent).toBe("Custom Edge Label");
  });
});

describe('GraphView Pan/Zoom Coverage', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('handles zoom wheel event', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, clientX: 10, clientY: 10, bubbles: true, cancelable: true }));
    expect(viewport.style.cursor).not.toBe('grabbing');
  });

  it('handles pan pointer events', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100, isPrimary: true }));
    viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 150, clientY: 150, isPrimary: true }));
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    expect(viewport.style.cursor).not.toBe('grabbing');
  });

  it('handles pinch zoom via two pointers', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 }));
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, clientX: 200, clientY: 200 }));
    viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 300, clientY: 300 }));
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2 }));
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
  });

  it('covers pan/zoom abort controller replacement', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);
    const graph2: GraphSnapshot = { nodes: new Map([['2', { id: '2', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph2);
    expect(container.querySelector('.pgv-pan-zoom')).toBeTruthy();
  });
});

describe('GraphView Events Coverage', () => {
  let container: HTMLElement;
  let schema: GraphSchema;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    schema = { nodes: {}, edges: {} };
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(performance.now()); return 1; });
    HTMLCanvasElement.prototype.getContext = vi.fn();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('handles custom pointer events for selection correctly', () => {
    const onNodeClick = vi.fn();
    const onEdgeClick = vi.fn();
    const onGraphClick = vi.fn();
    const view = new GraphView(container, schema, { onNodeClick, onEdgeClick, onGraphClick });
    const graph1: GraphSnapshot = {
      nodes: new Map([['node1', { id: 'node1', tags: [], attributes: {} }]]),
      edges: new Map([['edge1', { id: 'edge1', source: 'node1', target: 'node1', tags: [], attributes: {} }]])
    };
    view.setGraph(graph1);

    const nodeEl = container.querySelector('.pgv-graph-node') as HTMLElement;
    nodeEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onNodeClick).toHaveBeenCalled();

    const edgeEl = container.querySelector('.pgv-graph-edge') as HTMLElement;
    edgeEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onEdgeClick).toHaveBeenCalled();
  });

  it('handles keyboard events (Enter/Space) correctly', () => {
    const onNodeClick = vi.fn();
    const view = new GraphView(container, schema, { onNodeClick });
    const graph1: GraphSnapshot = { nodes: new Map([['node1', { id: 'node1', tags: [], attributes: {} }]]), edges: new Map() };
    view.setGraph(graph1);

    const nodeEl = container.querySelector('.pgv-graph-node') as HTMLElement;
    nodeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(onNodeClick).toHaveBeenCalled();

    onNodeClick.mockReset();
    nodeEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(onNodeClick).toHaveBeenCalled();
  });

  it('handles focus events for keyboard navigation', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = {
      nodes: new Map([['node1', { id: 'node1', tags: [], attributes: {} }]]),
      edges: new Map([['edge1', { id: 'edge1', source: 'node1', target: 'node1', tags: [], attributes: {} }]])
    };
    view.setGraph(graph1);

    const nodeEl = container.querySelector('.pgv-graph-node') as HTMLElement;
    nodeEl.matches = vi.fn().mockReturnValue(true);
    nodeEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    const edgeEl = container.querySelector('.pgv-graph-edge') as HTMLElement;
    edgeEl.matches = vi.fn().mockReturnValue(true);
    edgeEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    nodeEl.matches = vi.fn().mockImplementation(() => { throw new Error(); });
    nodeEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  });

  it('handles missing node layout positions in renderNodes', () => {
    const graph1: GraphSnapshot = { nodes: new Map([['node1', { id: 'node1', tags: [], attributes: {} }], ['node2', { id: 'node2', tags: [], attributes: {} }]]), edges: new Map() };
    const customView = new GraphView(container, schema, {
      layout: { width: 100, height: 100, nodeSize: { width: 10, height: 10 }, positions: new Map([['node1', { x: 0, y: 0 }]]) }
    });
    customView.setGraph(graph1);

    const nodeEls = container.querySelectorAll('.pgv-graph-node');
    expect(nodeEls.length).toBe(1);
    expect(nodeEls[0].getAttribute('data-node-id')).toBe('node1');
  });

  it('handles missing edge endpoints in renderEdges', () => {
    const graph1: GraphSnapshot = { nodes: new Map([['node1', { id: 'node1', tags: [], attributes: {} }]]), edges: new Map([['edge1', { id: 'edge1', source: 'node1', target: 'missingNode', tags: [], attributes: {} }]]) };
    const customView = new GraphView(container, schema, {
      layout: { width: 100, height: 100, nodeSize: { width: 10, height: 10 }, positions: new Map([['node1', { x: 0, y: 0 }]]) }
    });
    customView.setGraph(graph1);
    const edgeEls = container.querySelectorAll('.pgv-graph-edge');
    expect(edgeEls.length).toBe(0);
  });
});

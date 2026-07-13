import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { tagToClassName, GraphView } from '../src/renderer';
import { createGraphSnapshot, createGraphDiff, GraphSnapshotJson } from '../src/model';
import { verticalLayout } from '../src/layout';

describe('tagToClassName', () => {
  it('converts basic alphanumeric tags correctly', () => {
    expect(tagToClassName('Entry')).toBe('tag-entry');
    expect(tagToClassName('Branch')).toBe('tag-branch');
    expect(tagToClassName('tag1')).toBe('tag-tag1');
  });

  it('preserves hyphens and underscores', () => {
    expect(tagToClassName('back-edge')).toBe('tag-back-edge');
    expect(tagToClassName('true_branch')).toBe('tag-true_branch');
  });

  it('converts multiple special characters to a single hyphen', () => {
    expect(tagToClassName('invalid!@#tag')).toBe('tag-invalid-tag');
    expect(tagToClassName('a.b.c')).toBe('tag-a-b-c');
    expect(tagToClassName('foo bar')).toBe('tag-foo-bar');
  });

  it('removes leading and trailing hyphens after processing', () => {
    expect(tagToClassName('---hello---')).toBe('tag-hello');
    expect(tagToClassName('!hello!')).toBe('tag-hello');
    expect(tagToClassName('-hello-world-')).toBe('tag-hello-world');
  });

  it('trims whitespace before processing', () => {
    expect(tagToClassName('   padded   ')).toBe('tag-padded');
    expect(tagToClassName('\t\nspaced\n\t')).toBe('tag-spaced');
  });

  it('handles entirely non-alphanumeric tags and empty strings', () => {
    expect(tagToClassName('')).toBe('tag-untagged');
    expect(tagToClassName('   ')).toBe('tag-untagged');
    expect(tagToClassName('!@#$')).toBe('tag-untagged');
    expect(tagToClassName('---')).toBe('tag-untagged');
  });

  it('evicts cache when exceeding 10,000 unique tags', () => {
    for (let i = 0; i <= 10000; i++) {
      tagToClassName(`cache-test-${i}`);
    }
    const result = tagToClassName('cache-test-overflow');
    expect(result).toBe('tag-cache-test-overflow');
  });
});

describe('GraphView', () => {
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

    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    });

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      stroke: vi.fn(),
    })) as any;

    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('initializes and renders a graph with basic layout properties', () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [
        { id: "n1", tags: ["A"], attributes: { attr1: "value1" } },
        { id: "n2", tags: ["B"], attributes: {} }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", tags: [], attributes: {} }
      ]
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout });
    view.setGraph(snapshot);

    expect(view).toBeInstanceOf(GraphView);

    const graphViewElement = container.querySelector('.pgv-graph-view') as HTMLElement;
    expect(graphViewElement).not.toBeNull();

    const nodes = container.querySelectorAll('.pgv-graph-node');
    expect(nodes.length).toBe(2);

    const edges = container.querySelectorAll('.pgv-graph-edge');
    expect(edges.length).toBe(1);

    view.destroy();
  });

  it('handles viewport interaction (pan)', () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    expect(viewport).not.toBeNull();
    const stage = container.querySelector('.pgv-graph-stage') as HTMLElement;
    expect(stage).not.toBeNull();

    const initialTransform = stage.style.transform;

    const pointerdown = new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, pointerType: 'mouse', button: 0 });
    viewport.dispatchEvent(pointerdown);

    const pointermove = new PointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 200, pointerType: 'mouse' });
    viewport.dispatchEvent(pointermove);

    expect(stage.style.transform).not.toEqual(initialTransform);

    const pointerup = new PointerEvent('pointerup', { pointerId: 1, clientX: 200, clientY: 200, pointerType: 'mouse' });
    viewport.dispatchEvent(pointerup);

    view.destroy();
  });

  it('handles viewport interaction (zoom)', () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    expect(viewport).not.toBeNull();
    const stage = container.querySelector('.pgv-graph-stage') as HTMLElement;
    expect(stage).not.toBeNull();

    const initialTransform = stage.style.transform;

    const wheelEvent = new WheelEvent('wheel', { deltaY: 100, clientX: 500, clientY: 400 });
    viewport.dispatchEvent(wheelEvent);

    expect(stage.style.transform).not.toEqual(initialTransform);

    view.destroy();
  });

  it('handles minimap toggle and interactions', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true, useThemeToggle: true });
    view.setGraph(snapshot);

    const minimapBtn = container.querySelector('button[aria-label="Toggle Minimap"]') || container.querySelector('button[title="Toggle Minimap"]') as HTMLButtonElement;
    expect(minimapBtn).not.toBeNull();

    (minimapBtn as HTMLButtonElement).click();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const minimapContainerOpen = container.querySelector('.pgv-minimap');
    expect(minimapContainerOpen?.classList.contains('pgv-minimap-open')).toBe(true);

    const minimapViewportBox = container.querySelector('.pgv-minimap-viewport') as HTMLElement;
    expect(minimapViewportBox).not.toBeNull();

    const pointerdown = new PointerEvent('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, pointerType: 'mouse', button: 0 });
    minimapContainerOpen!.dispatchEvent(pointerdown);

    const pointermove = new PointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'mouse' });
    minimapContainerOpen!.dispatchEvent(pointermove);

    const pointerup = new PointerEvent('pointerup', { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'mouse' });
    minimapContainerOpen!.dispatchEvent(pointerup);

    const minimapBtnClose = container.querySelector('button[aria-label="Toggle Minimap"]') || container.querySelector('button[title="Toggle Minimap"]') as HTMLButtonElement;

    minimapBtnClose.click();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const minimapContainerClosed = container.querySelector('.pgv-minimap');
    expect(minimapContainerClosed?.classList.contains('pgv-minimap-open')).toBe(false);

    view.destroy();
  });

  it('handles search functionality', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "n1", tags: ["A"], attributes: { color: "red" } }, { id: "n2", tags: ["B"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    // Wait for the render queue to empty
    await new Promise(resolve => setTimeout(resolve, 50));

    // Toggle search open
    const searchToggleBtn = container.querySelector('button[title="Toggle Search"]') as HTMLButtonElement;
    expect(searchToggleBtn).not.toBeNull();
    searchToggleBtn.click();

    const searchBar = container.querySelector('.pgv-search-bar');
    expect(searchBar).not.toBeNull();

    const searchInput = container.querySelector('.pgv-search-input-wrapper input') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    // Simulate typing
    searchInput.value = "n1";
    searchInput.dispatchEvent(new Event('input'));

    const searchBtn = container.querySelector('button[title="Search"]') as HTMLButtonElement;
    expect(searchBtn).not.toBeNull();
    expect(searchBtn.disabled).toBe(false);

    // Execute search
    searchBtn.click();

    // Check results
    const resultInfo = container.querySelector('.pgv-search-results-info');
    expect(resultInfo?.textContent).toContain("1 of 1");

    // Cycle search
    const cycleBtn = container.querySelector('button[aria-label="Cycle search results"]') || container.querySelector('button[title="Cycle Results"]') || container.querySelector('button[aria-label="Cycle Results"]') as HTMLButtonElement;
    cycleBtn.click();

    // Change search mode to attribute
    const select = container.querySelector('.pgv-search-bar select') as HTMLSelectElement;
    select.value = "node-attribute";
    select.dispatchEvent(new Event('change'));

    const keyInput = container.querySelector('input[placeholder="Attribute Key..."]') as HTMLInputElement;
    expect(keyInput).not.toBeNull();
    keyInput.value = "color";
    keyInput.dispatchEvent(new Event('input'));

    const valInput = container.querySelector('input[placeholder="Attribute Value..."]') as HTMLInputElement;
    expect(valInput).not.toBeNull();
    valInput.value = "red";
    valInput.dispatchEvent(new Event('input'));

    // Need to select the potentially new search button after re-render
    const searchBtnAttr = container.querySelector('button[title="Search"]') as HTMLButtonElement;
    searchBtnAttr.click();

    const resultInfoAttr = container.querySelector('.pgv-search-results-info');
    expect(resultInfoAttr?.textContent).toContain("1 of 1");

    // Click close button
    const closeBtn = container.querySelector('button[aria-label="Close Search"]') as HTMLButtonElement;
    if (closeBtn) {
        closeBtn.click();
    }

    view.destroy();
  });

  it('handles theme toggling', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, useThemeToggle: true, usePanZoom: true });
    view.setGraph(snapshot);

    await new Promise(resolve => setTimeout(resolve, 50));

    let root = container.querySelector('.pgv-graph-view') as HTMLElement;

    expect(root.classList.contains('pgv-light')).toBe(false);
    expect(root.classList.contains('pgv-dark')).toBe(false);

    let themeBtn = container.querySelector('button[title^="Theme:"]') as HTMLButtonElement;
    expect(themeBtn).not.toBeNull();

    themeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    root = container.querySelector('.pgv-graph-view') as HTMLElement;
    expect(root.classList.contains('pgv-light')).toBe(true);

    themeBtn = container.querySelector('button[title^="Theme:"]') as HTMLButtonElement;

    themeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    root = container.querySelector('.pgv-graph-view') as HTMLElement;
    expect(root.classList.contains('pgv-dark')).toBe(true);

    themeBtn = container.querySelector('button[title^="Theme:"]') as HTMLButtonElement;

    themeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    root = container.querySelector('.pgv-graph-view') as HTMLElement;
    expect(root.classList.contains('pgv-light')).toBe(false);
    expect(root.classList.contains('pgv-dark')).toBe(false);

    view.destroy();
  });

  it('handles graph diff history navigation', async () => {
    const json: GraphSnapshotJson = {
      graphId: "test-graph",
      version: 1,
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);

    const view = new GraphView(container, {}, { layout, maxHistory: 10 });
    view.setGraph(snapshot);

    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1);

    const diff = createGraphDiff({
        addedNodes: [{ id: "n2", tags: ["B"], attributes: {} }],
        addedEdges: [{ id: "e1", source: "n1", target: "n2", tags: [], attributes: {} }],
        removedNodes: [],
        removedEdges: [],
        addedContainment: [],
        removedContainment: []
    });

    view.applyDiff(diff);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2);

    const leftBtn = container.querySelector('button[title="Previous Graph Snapshot"]') || container.querySelector('button[aria-label="No previous snapshots available"]') as HTMLButtonElement;
    const rightBtn = container.querySelector('button[title="Next Graph Snapshot"]') || container.querySelector('button[aria-label="No newer snapshots available"]') as HTMLButtonElement;
    const rwBtn = container.querySelector('button[title="Earliest Graph Snapshot"]') || container.querySelector('button[aria-label="Already at earliest snapshot"]') as HTMLButtonElement;
    const ffBtn = container.querySelector('button[title="Latest Graph Snapshot"]') || container.querySelector('button[aria-label="Already at latest snapshot"]') as HTMLButtonElement;

    expect(leftBtn).not.toBeNull();
    expect(rightBtn).not.toBeNull();

    (leftBtn as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1);

    const rightBtn2 = container.querySelector('button[title="Next Graph Snapshot"]') as HTMLButtonElement;
    rightBtn2.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2);

    const rwBtn2 = container.querySelector('button[title="Earliest Graph Snapshot"]') as HTMLButtonElement;
    rwBtn2.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(1);

    const ffBtn2 = container.querySelector('button[title="Latest Graph Snapshot"]') as HTMLButtonElement;
    ffBtn2.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.querySelectorAll('.pgv-graph-node').length).toBe(2);

    view.destroy();
  });

  describe("Edge Labels and Custom Node Content", () => {
    it("renders edge labels correctly", () => {
      const container = document.createElement("div");
      const json: GraphSnapshotJson = {
        nodes: [{ id: "n1" }, { id: "n2" }],
        edges: [{ id: "e1", source: "n1", target: "n2", attributes: { label: "myLabel" } }]
      };
      const snap = createGraphSnapshot(json);
      const view = new GraphView(container, snap.schema || {}, {
        edgeLabel: (e) => e.attributes.label as string
      });
      view.setGraph(snap);

      const label = container.querySelector(".pgv-edge-label");
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe("myLabel");

      view.destroy();
    });

    it("renders custom string and HTML node content", () => {
      const container = document.createElement("div");
      const json: GraphSnapshotJson = {
        nodes: [{ id: "n1" }, { id: "n2" }],
        edges: []
      };
      const snap = createGraphSnapshot(json);
      const view = new GraphView(container, snap.schema || {}, {
        nodeContent: (n) => {
          if (n.id === "n1") return "string-content";
          const div = document.createElement("div");
          div.className = "custom-html-content";
          div.textContent = "html-content";
          return div;
        }
      });
      view.setGraph(snap);

      const n1 = container.querySelector('.pgv-graph-node[data-node-id="n1"]');
      expect(n1).not.toBeNull();
      expect(n1?.textContent).toBe("string-content");

      const n2 = container.querySelector('.pgv-graph-node[data-node-id="n2"]');
      expect(n2).not.toBeNull();
      const customDiv = n2?.querySelector(".custom-html-content");
      expect(customDiv).not.toBeNull();
      expect(customDiv?.textContent).toBe("html-content");

      view.destroy();
    });

    it("renders node attributes in a default <dl> list", () => {
      const container = document.createElement("div");
      const json: GraphSnapshotJson = {
        nodes: [{ id: "n1", attributes: { a: { float: 1.5 }, b: { integer: 2 }, c: { bytes: "xyz" } } }],
        edges: []
      };
      const snap = createGraphSnapshot(json);
      const view = new GraphView(container, snap.schema || {});
      view.setGraph(snap);

      const dl = container.querySelector("dl.pgv-node-attributes");
      expect(dl).not.toBeNull();

      const dds = container.querySelectorAll("dd");
      expect(dds.length).toBe(3);
      expect(dds[0].textContent).toBe("1.5");
      expect(dds[1].textContent).toBe("2");
      expect(dds[2].textContent).toBe("[bytes: xyz]");

      view.destroy();
    });
  });
  describe("Graph Selection Highlight Rendering", () => {
    it("applies pgv-selected class to selected nodes and edges", () => {
      const graph = createGraphSnapshot({
        nodes: [{ id: "A" }, { id: "B" }],
        edges: [{ id: "e1", source: "A", target: "B" }]
      });

      const container = document.createElement("div");
      const schema = { tags: {}, edgeAttributes: {}, nodeAttributes: {} };
      const view = new GraphView(container, schema);

      view.setGraph(graph, {
        selection: {
          nodes: new Set(["A"]),
          edges: new Set(["e1"])
        }
      });

      const nodeA = container.querySelector(".graph-node[data-node-id='A']");
      const nodeB = container.querySelector(".graph-node[data-node-id='B']");
      const edge = container.querySelector(".graph-edge");

      expect(nodeA?.getAttribute("class")).toContain("pgv-selected");
      expect(nodeB?.getAttribute("class")).not.toContain("pgv-selected");
      expect(edge?.getAttribute("class")).toContain("pgv-selected");

      view.destroy();
    });
  });
});

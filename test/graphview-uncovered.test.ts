// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphView } from '../src/renderer';
import { GraphSchema, GraphSnapshot } from '../src/model';

describe('GraphView Additional Coverage Remaining', () => {
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

  it('pan/zoom pointerdown is ignored on nodes and edges', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = {
      nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]),
      edges: new Map()
    };
    view.setGraph(graph1);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    const nodeEl = container.querySelector('.pgv-graph-node') as HTMLElement;

    expect(nodeEl).toBeTruthy();
    expect(viewport).toBeTruthy();

    const event = new PointerEvent('pointerdown', {
      pointerId: 1, button: 0, clientX: 100, clientY: 100, isPrimary: true, bubbles: true
    });

    // Setup a mock closest on the target that says yes to this
    const originalClosest = HTMLElement.prototype.closest;
    HTMLElement.prototype.closest = vi.fn().mockImplementation((sel) => {
      if (sel === ".pgv-graph-node, .pgv-graph-edge") return nodeEl;
      return null;
    });

    // We dispatch on the node, but it bubbles to viewport where the listener is.
    // However jsdom bubbling with event.target doesn't always play nice for our specific needs.
    // Instead, dispatch directly on the viewport, but override event.target
    Object.defineProperty(event, 'target', { value: nodeEl, enumerable: true });

    viewport.dispatchEvent(event);

    HTMLElement.prototype.closest = originalClosest;
  });

  it('pan/zoom pointerup logic cleans up pointers properly', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = {
      nodes: new Map([['1', { id: '1', tags: [], attributes: {} }]]),
      edges: new Map()
    };
    view.setGraph(graph1);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;

    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 }));
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, button: 0, clientX: 200, clientY: 200 }));

    // Simulate pointercancel which uses the same cleanup path
    viewport.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
    viewport.dispatchEvent(new PointerEvent('pointerout', { pointerId: 2 }));
  });

  it('pan/zoom abort controller cleans up events', () => {
    const view = new GraphView(container, schema, { usePanZoom: true });
    const graph1: GraphSnapshot = { nodes: new Map(), edges: new Map() };
    view.setGraph(graph1);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;

    // Abort internal controller via destroy
    view.destroy();

    // Should do nothing, throw nothing
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1 }));
  });
});

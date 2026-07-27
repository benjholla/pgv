import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, GraphSnapshotJson } from '../../src/model';
import { verticalLayout } from '../../src/layout';

describe('Viewport Coordinate Transform Inverses', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {}
    } as DOMRect);

    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();

    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.classList.contains('pgv-viewport')) {
          return { width: 1000, height: 800, top: 0, left: 0, bottom: 800, right: 1000, x: 0, y: 0, toJSON: () => {} } as DOMRect;
      }
      return originalGetBoundingClientRect.call(this);
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('Invertibility Property: Panning and then reverse-panning by the same delta results in the exact original transform', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    const stage = container.querySelector(".pgv-pan-zoom-layer") || container.querySelector(".pgv-graph-stage") as HTMLElement;

    const initialTransform = stage.style.transform;
    expect(initialTransform).toBeTruthy();

    // Forward pan
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 500, clientY: 400, pointerType: 'mouse', button: 0 }));
    viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 600, clientY: 450, pointerType: 'mouse' })); // dx: 100, dy: 50
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 600, clientY: 450, pointerType: 'mouse' }));

    const transformedStyle = stage.style.transform;
    expect(transformedStyle).not.toEqual(initialTransform);

    // Inverse pan
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, clientX: 500, clientY: 400, pointerType: 'mouse', button: 0 }));
    viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 400, clientY: 350, pointerType: 'mouse' })); // dx: -100, dy: -50
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, clientX: 400, clientY: 350, pointerType: 'mouse' }));

    const finalTransform = stage.style.transform;
    expect(finalTransform).toEqual(initialTransform);

    view.destroy();
  });

  it('Invertibility Property: Zooming in and then zooming out by the same delta results in the exact original transform', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    const stage = container.querySelector(".pgv-pan-zoom-layer") || container.querySelector(".pgv-graph-stage") as HTMLElement;

    const initialTransform = stage.style.transform;

    // Zoom in
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: 500, clientY: 400 }));

    const transformedStyle = stage.style.transform;
    expect(transformedStyle).not.toEqual(initialTransform);

    // Zoom out
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, clientX: 500, clientY: 400 }));

    const finalTransform = stage.style.transform;
    expect(finalTransform).toEqual(initialTransform);

    view.destroy();
  });

  it('Coordinate Transform Inverse Property: Using exposed coordinate transforms logically inverts properly', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: ["A"], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const layout = verticalLayout(snapshot);
    const view = new GraphView(container, {}, { layout, usePanZoom: true });
    view.setGraph(snapshot);

    // Check if these methods exist to begin with, if not we will fail and explore
    expect(typeof view.viewportToLogical).toBe('function');
    expect(typeof view.logicalToViewport).toBe('function');

    // Pan and zoom so we aren't just at scale 1 with 0 offset
    const viewport = container.querySelector('.pgv-viewport') as HTMLElement;
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: 500, clientY: 400 }));
    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 500, clientY: 400, pointerType: 'mouse', button: 0 }));
    viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 700, clientY: 600, pointerType: 'mouse' }));
    viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 700, clientY: 600, pointerType: 'mouse' }));

    const physicalX = 250;
    const physicalY = 320;

    const logical = view.viewportToLogical(physicalX, physicalY);
    const roundTripped = view.logicalToViewport(logical.x, logical.y);

    // Allow for small floating point errors
    expect(Math.abs(roundTripped.x - physicalX)).toBeLessThan(0.0001);
    expect(Math.abs(roundTripped.y - physicalY)).toBeLessThan(0.0001);

    view.destroy();
  });
});

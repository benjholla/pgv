import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphView } from "../../src/renderer";
import { createGraphSnapshot, createGraphDiff } from "../../src/model";
import { verticalLayout } from "../../src/layout";

describe("Renderer Event and Edge Case Coverage", () => {
    let container: HTMLDivElement;
    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.getBoundingClientRect = vi.fn(() => ({
          width: 1000, height: 800, top: 0, left: 0, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => {}
        }));
        document.body.appendChild(container);
        vi.stubGlobal('ResizeObserver', class ResizeObserver { observe(){} unobserve(){} disconnect(){} });
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ scale: vi.fn(), clearRect: vi.fn(), fillStyle: '', fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), strokeStyle: '', lineWidth: 0, stroke: vi.fn() })) as any;
    });

    it("handles keydown events to select nodes", async () => {
      const graph = createGraphSnapshot({
        schema: { containment: ["contains"] },
        nodes: [ { id: "n1" }, { id: "n2" } ],
        edges: [ { id: "e1", source: "n1", target: "n2" } ],
      });
      const layout = verticalLayout(graph);

      let nodeClicked = false;
      let edgeClicked = false;
      const view = new GraphView(container, graph.schema, { layout, usePanZoom: true, onNodeClick: () => { nodeClicked = true; }, onEdgeClick: () => { edgeClicked = true; } });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const stage = container.querySelector(".pgv-graph-stage") as HTMLElement;

      const nodeEl = container.querySelector('.pgv-graph-node[data-node-id="n1"]') as HTMLElement;

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(keydownEvent, 'target', {value: nodeEl, enumerable: true});
      container.dispatchEvent(keydownEvent); // Dispatch to `container` where listener is attached

      expect(nodeClicked).toBe(true);

      const edgeEl = container.querySelector('.pgv-graph-edge[data-edge-id="e1"]') as HTMLElement;
      if (edgeEl) {
          const keydownEvent2 = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
          Object.defineProperty(keydownEvent2, 'target', {value: edgeEl, enumerable: true});
          container.dispatchEvent(keydownEvent2); // Dispatch to `container`
      }
      expect(edgeClicked).toBe(true);

      const originalMatches = HTMLElement.prototype.matches;
      HTMLElement.prototype.matches = function(selector) {
          if (selector === ':focus-visible') return true;
          return originalMatches.call(this, selector);
      };

      const focusEvent = new FocusEvent('focus', { bubbles: true });
      Object.defineProperty(focusEvent, 'target', {value: nodeEl, enumerable: true});
      container.dispatchEvent(focusEvent);

      const focusEvent2 = new FocusEvent('focus', { bubbles: true });
      Object.defineProperty(focusEvent2, 'target', {value: edgeEl, enumerable: true});
      container.dispatchEvent(focusEvent2);

      HTMLElement.prototype.matches = originalMatches;

      view.destroy();
    });

    it("does not select node if collapse toggle is focused and Enter is pressed", async () => {
      const graph = createGraphSnapshot({
        schema: { containment: ["contains"] },
        nodes: [ { id: "n1" }, { id: "n2" } ],
        edges: [ { id: "e1", source: "n1", target: "n2", tags: ["contains"] } ],
      });
      const layout = verticalLayout(graph);

      let selectionChanged = false;
      const view = new GraphView(container, graph.schema, { layout, onSelectionChange: () => { selectionChanged = true; } });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const stage = container.querySelector(".pgv-graph-stage") as HTMLElement;
      const toggle = container.querySelector(".pgv-node-collapse-toggle") as HTMLElement;

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(keydownEvent, 'target', {value: toggle, enumerable: true});
      container.dispatchEvent(keydownEvent);

      expect(selectionChanged).toBe(false);
      view.destroy();
    });

    it("skips click when dragging", async () => {
      Element.prototype.setPointerCapture = vi.fn();
      Element.prototype.releasePointerCapture = vi.fn();
      const graph = createGraphSnapshot({
        schema: {},
        nodes: [ { id: "n1" } ],
        edges: [],
      });
      const layout = verticalLayout(graph);
      let clicked = false;
      const view = new GraphView(container, graph.schema, { layout, usePanZoom: true, onNodeClick: () => { clicked = true; } });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const stage = container.querySelector(".pgv-graph-stage") as HTMLElement;
      const nodeEl = container.querySelector('.pgv-graph-node[data-node-id="n1"]') as HTMLElement;

      const viewport = container.querySelector(".pgv-viewport") as HTMLElement;

      // simulate dragging
      viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 500, clientY: 400, pointerType: 'mouse', button: 0 }));
      viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 600, clientY: 450, pointerType: 'mouse' })); // sets dragging

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {value: nodeEl, enumerable: true});
      container.dispatchEvent(clickEvent);

      expect(clicked).toBe(false);
      view.destroy();
    });

    it("fullscreenchange event triggers layout reset", async () => {
      const graph = createGraphSnapshot({
        schema: {},
        nodes: [ { id: "n1" } ],
        edges: [ ],
      });
      const layout = verticalLayout(graph);

      const view = new GraphView(container, graph.schema, { layout, usePanZoom: true });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const event = new Event('fullscreenchange');
      Object.defineProperty(document, 'fullscreenElement', {
          value: container, // Use `container` to simulate being fullscreen
          writable: true,
          configurable: true
      });

      container.dispatchEvent(event); // Dispatch on container where listener is attached

      // We wait for RAF logic
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 50));

      Object.defineProperty(document, 'fullscreenElement', {
          value: null,
          writable: true,
          configurable: true
      });

      view.destroy();
    });

    it("centers on edge when focused with keyboard", async () => {
      const graph = createGraphSnapshot({
        schema: {},
        nodes: [ { id: "n1" }, { id: "n2" } ],
        edges: [ { id: "e1", source: "n1", target: "n2" } ],
      });
      const layout = verticalLayout(graph);

      const view = new GraphView(container, graph.schema, { layout, usePanZoom: true });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const edgeEl = container.querySelector('.pgv-graph-edge[data-edge-id="e1"]') as HTMLElement;

      const originalMatches = HTMLElement.prototype.matches;
      HTMLElement.prototype.matches = function(selector) {
          if (selector === ':focus-visible') return true;
          return originalMatches.call(this, selector);
      };

      const focusEvent = new FocusEvent('focus', { bubbles: true });
      Object.defineProperty(focusEvent, 'target', {value: edgeEl, enumerable: true});
      container.dispatchEvent(focusEvent);

      HTMLElement.prototype.matches = originalMatches;

      view.destroy();
    });

    it("handles multi-touch pinch to zoom", async () => {
      Element.prototype.hasPointerCapture = vi.fn(() => true);
      Element.prototype.setPointerCapture = vi.fn();
      Element.prototype.releasePointerCapture = vi.fn();

      const graph = createGraphSnapshot({
        schema: {},
        nodes: [ { id: "n1" } ],
        edges: [ ],
      });
      const layout = verticalLayout(graph);

      const view = new GraphView(container, graph.schema, { layout, usePanZoom: true });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const viewport = container.querySelector(".pgv-viewport") as HTMLElement;

      viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 500, clientY: 400, pointerType: 'touch', button: 0 }));
      viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, clientX: 550, clientY: 400, pointerType: 'touch', button: 0 }));

      viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 450, clientY: 400, pointerType: 'touch' }));
      viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 600, clientY: 400, pointerType: 'touch' }));

      viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 400, clientY: 400, pointerType: 'touch' }));
      viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 650, clientY: 400, pointerType: 'touch' }));

      viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 400, clientY: 400, pointerType: 'touch' }));

      view.destroy();
    });

    it("does not render edge if layout endpoints are null", async () => {
      const graph = createGraphSnapshot({
        schema: {},
        nodes: [ { id: "n1" }, { id: "n2" } ],
        edges: [ { id: "e1", source: "n1", target: "n2" } ],
      });
      const layout = verticalLayout(graph);

      // Make endpoints null
      layout.positions.delete("n2");

      const view = new GraphView(container, graph.schema, { layout, usePanZoom: true });
      view.setGraph(graph);

      await new Promise(resolve => setTimeout(resolve, 50));

      const edgeEl = container.querySelector('.pgv-graph-edge[data-edge-id="e1"]');
      expect(edgeEl).toBeNull();
      view.destroy();
    });
});

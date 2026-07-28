import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphView } from "../../src/renderer";
import { createGraphSnapshot } from "../../src/model";

describe("Coverage fixes for src/renderer.ts", () => {
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

    it("handles click on collapse toggle inside a compound node", () => {
      const graph = createGraphSnapshot({
        nodes: [ { id: "parent" }, { id: "child" } ],
        edges: [ { id: "e1", source: "parent", target: "child", tags: ["contains"] } ],
        schema: { containment: ["contains"] }
      });
      const view = new GraphView(container, graph.schema);
      view.setGraph(graph);

      const parentEl = container.querySelector('.pgv-compound-node[data-node-id="parent"]');
      const toggle = parentEl?.querySelector(".pgv-node-collapse-toggle") as HTMLButtonElement;
      toggle.click();

      const collapsedParentEl = container.querySelector('.pgv-compound-node[data-node-id="parent"]');
      const title = collapsedParentEl?.querySelector('.pgv-node-title');
      const indicator = title?.querySelector('.pgv-node-hidden-indicator');
      expect(indicator).toBeDefined();
    });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, GraphSnapshotJson } from '../../src/model';

describe('GraphView.updateOptions', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('updates selection programmatically', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: [], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const view = new GraphView(container, {});
    view.setGraph(snapshot);

    const stage = container.querySelector(".pgv-graph-stage");
    expect(stage).toBeTruthy();

    // We actually need to re-select from DOM as render replaces things, or does it?
    let node = container.querySelector(".graph-node[data-node-id='n1']");
    expect(node?.getAttribute("class")).not.toContain("pgv-selected");

    view.updateOptions({
      selection: {
        nodes: new Set(["n1"]),
        edges: new Set()
      }
    });

    node = container.querySelector(".graph-node[data-node-id='n1']");
    expect(node?.getAttribute("class")).toContain("pgv-selected");

    view.destroy();
  });
});

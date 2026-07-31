import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, createGraphDiff, GraphSnapshotJson } from '../../src/model';

describe('GraphView History Limits', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('throws when applying diff while viewing a past state that would be expired', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: [], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const view = new GraphView(container, {}, { maxHistory: 2 });
    view.setGraph(snapshot);

    const diff1 = createGraphDiff({ addedNodes: [{id: "n2", tags: [], attributes: {}}], addedEdges: [] });
    const diff2 = createGraphDiff({ addedNodes: [{id: "n3", tags: [], attributes: {}}], addedEdges: [] });

    view.applyDiff(diff1);
    view.applyDiff(diff2);

    const historyToggleBtn = container.querySelector("[aria-label='Toggle History Navigation']") as HTMLButtonElement;
    historyToggleBtn.click();

    const rwBtn = container.querySelector("[aria-label='Earliest Graph Snapshot']") as HTMLButtonElement;
    rwBtn.click();

    const diff3 = createGraphDiff({ addedNodes: [{id: "n4", tags: [], attributes: {}}], addedEdges: [] });
    expect(() => view.applyDiff(diff3)).toThrow("Graph view is blocked. Applying diff would expire the currently viewed state.");
    view.destroy();
  });

  it('correctly drops old history when history capacity is exceeded', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: [], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    let currentGraph = snapshot;
    const view = new GraphView(container, {}, {
      maxHistory: 2,
      onGraphChange: (g) => { currentGraph = g; }
    });
    view.setGraph(snapshot);

    const diff1 = createGraphDiff({ addedNodes: [{id: "n2", tags: [], attributes: {}}], addedEdges: [] });
    const diff2 = createGraphDiff({ addedNodes: [{id: "n3", tags: [], attributes: {}}], addedEdges: [] });
    const diff3 = createGraphDiff({ addedNodes: [{id: "n4", tags: [], attributes: {}}], addedEdges: [] });

    view.applyDiff(diff1);
    view.applyDiff(diff2);
    view.applyDiff(diff3); // Exceeds max history of 2, oldest (diff1) gets baked into preHistoryGraph

    const historyToggleBtn = container.querySelector("[aria-label='Toggle History Navigation']") as HTMLButtonElement;
    historyToggleBtn.click();

    const rwBtn = container.querySelector("[aria-label='Earliest Graph Snapshot']") as HTMLButtonElement;
    rwBtn.click();

    // Test that the "earliest" snapshot is now (base + diff1)
    expect(currentGraph.nodes.has("n1")).toBe(true);
    expect(currentGraph.nodes.has("n2")).toBe(true);
    expect(currentGraph.nodes.has("n3")).toBe(false);
    expect(currentGraph.nodes.has("n4")).toBe(false);

    view.destroy();
  });
});

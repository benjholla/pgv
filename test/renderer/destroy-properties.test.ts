import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, GraphSnapshotJson } from '../../src/model';

describe('GraphView Destroy Properties', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('Resource Cleanup Property: Calling destroy clears out all DOM children and releases references', () => {
    const json: GraphSnapshotJson = {
      nodes: [{ id: "n1", tags: [], attributes: {} }],
      edges: []
    };
    const snapshot = createGraphSnapshot(json);
    const view = new GraphView(container, {}, { usePanZoom: true, useThemeToggle: true });
    view.setGraph(snapshot);

    expect(container.children.length).toBeGreaterThan(0);

    view.destroy();

    // Container should be empty
    expect(container.children.length).toBe(0);
    // Multiple calls to destroy should be safe (idempotence)
    expect(() => view.destroy()).not.toThrow();
  });
});

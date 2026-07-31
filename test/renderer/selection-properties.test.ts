import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GraphView } from '../../src/renderer';
import { createGraphSnapshot, GraphSnapshotJson, createGraphDiff } from '../../src/model';

describe('Selection Properties', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('Property: Collapsing a node strictly removes its hidden children and incident edges from the active selection via callback', () => {
    const json: GraphSnapshotJson = {
      schema: { containment: ["contains"] },
      nodes: [{ id: "parent" }, { id: "child" }, { id: "child2" }],
      edges: [
        { id: "e1", source: "parent", target: "child", tags: ["contains"] },
        { id: "e2", source: "parent", target: "child2", tags: ["contains"] },
        { id: "e3", source: "child", target: "child2" }
      ]
    };
    const snapshot = createGraphSnapshot(json);

    let currentSelection = {
      nodes: new Set(["child", "child2", "parent"]),
      edges: new Set(["e1", "e3"])
    };

    let callbackFiredCount = 0;

    const view = new GraphView(container, snapshot.schema, {
      selection: currentSelection,
      onSelectionChange: (sel) => {
        currentSelection = sel;
        callbackFiredCount++;
        // Update options to simulate app responding to callback
        view.updateOptions({ selection: currentSelection });
      }
    });
    view.setGraph(snapshot);

    const parentNode = container.querySelector(".pgv-compound-node[data-node-id='parent']") as HTMLElement;
    const toggleBtn = parentNode.querySelector(".pgv-node-collapse-toggle") as HTMLButtonElement;

    toggleBtn.click(); // Collapses the parent

    expect(callbackFiredCount).toBe(1);

    // Child nodes should be removed from selection
    expect(currentSelection.nodes.has("child")).toBe(false);
    expect(currentSelection.nodes.has("child2")).toBe(false);

    // Edges connected to children should be removed
    expect(currentSelection.edges.has("e1")).toBe(false);
    expect(currentSelection.edges.has("e3")).toBe(false);

    // Parent should still be selected
    expect(currentSelection.nodes.has("parent")).toBe(true);

    view.destroy();
  });
});

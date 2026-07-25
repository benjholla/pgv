const fs = require('fs');
let content = fs.readFileSync('src/renderer.ts', 'utf8');

const replaceChildrenStr = `    this.container.replaceChildren(root);`;

const newReplaceStr = `
    if (animate && oldStage && oldPanZoomLayer) {
      // Step 2: Pass 2 - Update (FLIP Retained Nodes)
      const newStage = stage;
      newStage.classList.add("new-stage");

      const newNodes = newStage.querySelectorAll<HTMLElement>(".pgv-graph-node, .pgv-compound-node");
      const enterNodes: HTMLElement[] = [];
      const flipNodes: { element: HTMLElement, dx: number, dy: number }[] = [];

      // Calculate deltas top-down to adjust for parent translations
      const parentDeltas = new Map<string, { dx: number, dy: number }>();

      for (let i = 0; i < newNodes.length; i++) {
        const node = newNodes[i];
        const nodeId = node.dataset.nodeId;
        if (!nodeId) continue;

        const oldRect = oldNodeRects.get(nodeId);
        if (oldRect) {
          // It's a retained node
          const newRect = node.getBoundingClientRect(); // JSDOM might return 0, we can use logical positions if we need to

          // Actually, since the new stage is not in the DOM yet, getBoundingClientRect() will be 0.
          // We should append the new root first before reading bounding rects!
        }
      }
    }

    this.container.replaceChildren(root);
`;

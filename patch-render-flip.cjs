const fs = require('fs');
let content = fs.readFileSync('src/renderer.ts', 'utf8');

// 1. applyViewport and panZoomLayer wrapper modifications
const replace1 = `    if (this.#options.usePanZoom || this.#options.useThemeToggle || (this.#options.maxHistory && this.#options.maxHistory > 0)) {
      const viewport = document.createElement("div");
      viewport.className = PGV_VIEWPORT_CLASS;

      stage.style.transform = \`translate(\${this.#viewportState.x}px, \${this.#viewportState.y}px) scale(\${this.#viewportState.scale})\`;
      stage.style.transformOrigin = "0 0";

      viewport.appendChild(stage);`;

const with1 = `    if (this.#options.usePanZoom || this.#options.useThemeToggle || (this.#options.maxHistory && this.#options.maxHistory > 0)) {
      const viewport = document.createElement("div");
      viewport.className = PGV_VIEWPORT_CLASS;

      const panZoomLayer = document.createElement("div");
      panZoomLayer.className = "pgv-pan-zoom-layer";
      panZoomLayer.style.transform = \`translate(\${this.#viewportState.x}px, \${this.#viewportState.y}px) scale(\${this.#viewportState.scale})\`;

      panZoomLayer.appendChild(stage);
      viewport.appendChild(panZoomLayer);`;

content = content.replace(replace1, with1);

const replaceViewport = `  #applyViewport(): void {
    const stage = this.container.querySelector<HTMLElement>(".pgv-graph-stage");
    if (stage) {
      stage.style.transform = \`translate(\${this.#viewportState.x}px, \${this.#viewportState.y}px) scale(\${this.#viewportState.scale})\`;
    }`;

const withViewport = `  #applyViewport(): void {
    const panZoomLayer = this.container.querySelector<HTMLElement>(".pgv-pan-zoom-layer");
    if (panZoomLayer) {
      panZoomLayer.style.transform = \`translate(\${this.#viewportState.x}px, \${this.#viewportState.y}px) scale(\${this.#viewportState.scale})\`;
    } else {
      const stage = this.container.querySelector<HTMLElement>(".pgv-graph-stage");
      if (stage) {
        stage.style.transform = \`translate(\${this.#viewportState.x}px, \${this.#viewportState.y}px) scale(\${this.#viewportState.scale})\`;
      }
    }`;

content = content.replace(replaceViewport, withViewport);


// 2. `#render` method signature and internal FLIP steps
content = content.replace('  #render(): void {', '  #render(animate: boolean = false): void {');

const replaceLayout = `    const layout = this.#layout;
    const root = document.createElement("div");`;

const withLayout = `    const layout = this.#layout;
    const root = document.createElement("div");

    // FLIP Step 0 & 1
    const oldPanZoomLayer = animate ? this.container.querySelector<HTMLElement>(".pgv-pan-zoom-layer") : null;
    const oldStage = oldPanZoomLayer ? oldPanZoomLayer.querySelector<HTMLElement>(".pgv-graph-stage:not(.exiting)") : null;
    const oldNodeRects = new Map<string, DOMRect>();

    if (animate && oldStage && oldPanZoomLayer) {
      // Step 0: "First" State Caching
      const nodes = oldStage.querySelectorAll<HTMLElement>(".pgv-graph-node, .pgv-compound-node");
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeId = node.dataset.nodeId;
        if (nodeId) {
          oldNodeRects.set(nodeId, node.getBoundingClientRect());
        }
      }

      // Step 1: Pass 1 - Exit (Fade Out Absent Elements)
      oldStage.classList.add("old-stage");
      oldStage.style.pointerEvents = "none";
      oldStage.style.position = "absolute";
      oldStage.style.top = "0";
      oldStage.style.left = "0";

      const newGraph = this.#graph;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeId = node.dataset.nodeId;
        if (nodeId && !newGraph.nodes.has(nodeId)) {
          node.classList.add("exiting");
        }
      }

      const oldEdges = oldStage.querySelectorAll<HTMLElement>(".pgv-graph-edge");
      for (let i = 0; i < oldEdges.length; i++) {
        const edge = oldEdges[i];
        const edgeId = edge.dataset.edgeId;
        if (edgeId && !newGraph.edges.has(edgeId)) {
          edge.classList.add("exiting");
        }
      }
    }`;

content = content.replace(replaceLayout, withLayout);


const replaceChildren = `    this.container.replaceChildren(root);`;

const withReplaceChildren = `    if (animate && oldStage && oldPanZoomLayer) {
      const newPanZoomLayer = root.querySelector<HTMLElement>(".pgv-pan-zoom-layer");
      if (newPanZoomLayer) {
        // Keep old stage in DOM for crossfade
        newPanZoomLayer.insertBefore(oldStage, newPanZoomLayer.firstChild);
      }
    }

    this.container.replaceChildren(root);

    if (animate && oldStage && oldPanZoomLayer) {
      // Step 2: Pass 2 - Update (FLIP Retained Nodes & Edge Crossfade)
      stage.classList.add("new-stage");

      const newNodes = stage.querySelectorAll<HTMLElement>(".pgv-graph-node, .pgv-compound-node");
      const enterNodes: HTMLElement[] = [];
      const flipNodes: { element: HTMLElement, dx: number, dy: number }[] = [];

      const scale = this.#viewportState.scale;

      // Process delta calculations top-down (parents first) is naturally handled by DOM order if rendered top-down,
      // but to be safe we subtract the parent's delta.
      for (let i = 0; i < newNodes.length; i++) {
        const node = newNodes[i];
        const nodeId = node.dataset.nodeId;
        if (!nodeId) continue;

        const oldRect = oldNodeRects.get(nodeId);
        if (oldRect) {
          const newRect = node.getBoundingClientRect();
          // Convert physical pixel coordinates back into logical layout coordinates using current viewport scale
          let dx = (oldRect.left - newRect.left) / scale;
          let dy = (oldRect.top - newRect.top) / scale;

          if (dx !== 0 || dy !== 0) {
            // Check for parent delta to subtract
            const parentCompound = node.parentElement?.closest<HTMLElement>(".pgv-compound-node");
            if (parentCompound && parentCompound.dataset.nodeId) {
              const parentFlip = flipNodes.find(f => f.element === parentCompound);
              if (parentFlip) {
                dx -= parentFlip.dx;
                dy -= parentFlip.dy;
              }
            }

            flipNodes.push({ element: node, dx, dy });
            // Invert Step: Set inline transform so they instantly match old positions
            node.style.transform = \`translate(\${dx}px, \${dy}px)\`;
          }
        } else {
          // New Node
          enterNodes.push(node);
          node.classList.add("entering");
        }
      }

      // Edges: Fade old out, fade new in
      const oldEdges = oldStage.querySelectorAll<HTMLElement>(".pgv-graph-edge:not(.exiting)");
      for (let i = 0; i < oldEdges.length; i++) {
        oldEdges[i].classList.add("exiting");
      }
      const newEdges = stage.querySelectorAll<HTMLElement>(".pgv-graph-edge");
      for (let i = 0; i < newEdges.length; i++) {
        newEdges[i].classList.add("entering");
        enterNodes.push(newEdges[i]);
      }

      // Reflow
      stage.offsetHeight;

      // Play Step
      stage.classList.add("pgv-animating");
      for (let i = 0; i < flipNodes.length; i++) {
        flipNodes[i].element.style.transform = "translate(0px, 0px)";
      }

      // Step 3: Pass 3 - Enter & Final Cleanup
      requestAnimationFrame(() => {
        for (let i = 0; i < enterNodes.length; i++) {
          enterNodes[i].classList.remove("entering");
        }
      });

      setTimeout(() => {
        oldStage.remove();
        stage.classList.remove("pgv-animating", "new-stage");
        for (let i = 0; i < flipNodes.length; i++) {
          flipNodes[i].element.style.transform = "";
        }
      }, 300);
    }`;

content = content.replace(replaceChildren, withReplaceChildren);


// 3. Update calls to this.#render() that should trigger animation
content = content.replace(
  `      this.#options.onGraphChange?.(this.#graph);\n      this.#render();`,
  `      this.#options.onGraphChange?.(this.#graph);\n      this.#render(true);`
);
content = content.replace(
  `    this.#options.onGraphChange?.(this.#graph);\n    this.#render();`,
  `    this.#options.onGraphChange?.(this.#graph);\n    this.#render(true);`
);
content = content.replace(
  `      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#schema);\n      this.#render();`,
  `      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#schema);\n      this.#render(true);`
);

fs.writeFileSync('src/renderer.ts', content);

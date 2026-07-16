const fs = require('fs');
let code = fs.readFileSync('src/renderer.ts', 'utf8');

const oldFunc = `function renderNodes(
  graph: GraphSnapshot,
  layout: LayoutSnapshot,
  options: GraphViewOptions,
  collapsedNodes: ReadonlySet<string> = new Set(),
  onToggleCollapse: (id: string) => void = () => {},
): HTMLElement[] {
  const nodes: HTMLElement[] = [];

  for (const node of graph.nodes.values()) {
    const position = layout.positions.get(node.id);

    if (!position) {
      continue;
    }

    const element = document.createElement("div");

    // Optimized string builder: avoids array allocations and .map() inside the hot loop.
    let className = "graph-node pgv-graph-node";
    for (let i = 0; i < node.tags.length; i++) {
      className += " " + tagToClassName(node.tags[i]);
    }

    if (options.selection?.nodes.has(node.id)) {
      className += " pgv-selected";
    }

    const isCollapsed = collapsedNodes.has(node.id);
    if (isCollapsed) {
      className += " pgv-node-collapsed";
    }

    element.className = className;
    element.dataset.nodeId = node.id;
    element.setAttribute("tabindex", "0");
    element.style.transform = \`translate(\${position.x}px, \${position.y}px)\`;

    // Explicitly set node width, let expanded nodes flow height naturally
    const nodeSize = layout.nodeSizes?.get(node.id) || layout.nodeSize;
    element.style.width = \`\${nodeSize.width}px\`;

    if (isCollapsed) {
      const header = document.createElement("div");
      header.className = "pgv-node-header-collapsed";

      const title = document.createElement("div");
      title.className = "pgv-node-title";
      title.textContent = node.id;

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "pgv-node-collapse-toggle";
      toggleBtn.title = "Expand node";
      toggleBtn.setAttribute("aria-label", "Expand node");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.textContent = "[+]";
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        onToggleCollapse(node.id);
      });

      header.append(title, toggleBtn);
      element.appendChild(header);
    } else {
      const content = options.nodeContent?.(node) ?? defaultNodeContent(node);

      if (typeof content === "string") {
        element.textContent = content;
      } else {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "pgv-node-collapse-toggle";
        toggleBtn.title = "Collapse node";
        toggleBtn.setAttribute("aria-label", "Collapse node");
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.textContent = "[-]";
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onToggleCollapse(node.id);
        });

        element.appendChild(content);
        element.appendChild(toggleBtn);
      }
    }

    nodes.push(element);
  }

  return nodes;
}`;

const newFunc = `function renderNodes(
  graph: GraphSnapshot,
  layout: LayoutSnapshot,
  options: GraphViewOptions,
  collapsedNodes: ReadonlySet<string> = new Set(),
  onToggleCollapse: (id: string) => void = () => {},
): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const elementsMap = new Map<string, HTMLElement>();

  // Determine hidden nodes
  const hiddenNodes = new Set<string>();
  for (const [id, node] of graph.nodes) {
    let current = node.parent;
    while (current) {
      if (collapsedNodes.has(current)) {
        hiddenNodes.add(id);
        break;
      }
      current = graph.nodes.get(current)?.parent;
    }
  }

  // First pass: Create DOM elements for visible nodes
  for (const node of graph.nodes.values()) {
    if (hiddenNodes.has(node.id)) continue;

    const position = layout.positions.get(node.id);
    if (!position) continue;

    const element = document.createElement("div");

    let className = "graph-node pgv-graph-node";
    for (let i = 0; i < node.tags.length; i++) {
      className += " " + tagToClassName(node.tags[i]);
    }

    if (options.selection?.nodes.has(node.id)) {
      className += " pgv-selected";
    }

    const isCollapsed = collapsedNodes.has(node.id);
    if (isCollapsed) {
      className += " pgv-node-collapsed";
    }

    element.className = className;
    element.dataset.nodeId = node.id;
    element.setAttribute("tabindex", "0");

    // Position using transform, but we will make it relative to parent later
    // Actually, if we nest DOM nodes, position should be relative to parent.
    // Let's store absolute position for now, and fix it in pass two.
    element.style.transform = \`translate(\${position.x}px, \${position.y}px)\`;

    const nodeSize = layout.nodeSizes?.get(node.id) || layout.nodeSize;
    element.style.width = \`\${nodeSize.width}px\`;
    element.style.height = \`\${nodeSize.height}px\`;

    if (isCollapsed) {
      const header = document.createElement("div");
      header.className = "pgv-node-header-collapsed";

      const title = document.createElement("div");
      title.className = "pgv-node-title";
      title.textContent = node.id;

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "pgv-node-collapse-toggle";
      toggleBtn.title = "Expand node";
      toggleBtn.setAttribute("aria-label", "Expand node");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.textContent = "[+]";
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        onToggleCollapse(node.id);
      });

      header.append(title, toggleBtn);
      element.appendChild(header);
    } else {
      const content = options.nodeContent?.(node) ?? defaultNodeContent(node);

      if (typeof content === "string") {
        element.textContent = content;
      } else {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "pgv-node-collapse-toggle";
        toggleBtn.title = "Collapse node";
        toggleBtn.setAttribute("aria-label", "Collapse node");
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.textContent = "[-]";
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onToggleCollapse(node.id);
        });

        element.appendChild(content);
        element.appendChild(toggleBtn);
      }
    }

    elementsMap.set(node.id, element);
  }

  // Second pass: Assemble hierarchy and adjust positions to be relative
  for (const node of graph.nodes.values()) {
    if (hiddenNodes.has(node.id)) continue;

    const element = elementsMap.get(node.id);
    if (!element) continue;

    const parentId = node.parent;
    if (parentId && !hiddenNodes.has(parentId) && elementsMap.has(parentId) && !collapsedNodes.has(parentId)) {
      const parentElement = elementsMap.get(parentId)!;
      const parentPosition = layout.positions.get(parentId)!;
      const position = layout.positions.get(node.id)!;

      // Adjust to relative coordinates
      element.style.transform = \`translate(\${position.x - parentPosition.x}px, \${position.y - parentPosition.y}px)\`;

      // We must append to the parent, but wait, the parent might have arbitrary content replacing it.
      // Usually expanded parent content shouldn't obscure children or we need a container.
      // For now we just append directly to the parent element
      parentElement.appendChild(element);
    } else {
      // Top level node
      nodes.push(element);
    }
  }

  return nodes;
}`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/renderer.ts', code);

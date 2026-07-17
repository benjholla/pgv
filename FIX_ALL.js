import fs from 'fs';

let code = fs.readFileSync('src/layout.ts', 'utf8');

const returnStatement = `  return Object.freeze({
    positions,
    width,
    height,
    nodeSize: Object.freeze({
      width: config.nodeWidth,
      height: config.nodeHeight,
    }),
    nodeSizes: Object.freeze(nodeSizes),
    edgeRouting,
  });`;

const replacement = `  // -- Start Compound Node Size Injection --
  const layoutHierarchy = new Map<string, { parent: string | null; children: string[] }>();
  for (const id of graph.nodes.keys()) {
    layoutHierarchy.set(id, { children: [], parent: null });
  }

  let hasHierarchy = false;
  if (schema?.containment) {
    hasHierarchy = true;
    for (const edge of graph.edges.values()) {
      let isContainment = false;
      for (let i = 0; i < edge.tags.length; i++) {
        if (schema.containment.includes(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }
      if (isContainment) {
        if (layoutHierarchy.has(edge.source) && layoutHierarchy.has(edge.target)) {
          layoutHierarchy.get(edge.source)!.children.push(edge.target);
          layoutHierarchy.get(edge.target)!.parent = edge.source;
        }
      }
    }

    const calcSize = (id: string): {w: number, h: number} => {
       const children = layoutHierarchy.get(id)?.children || [];
       if (children.length === 0) {
          const s = nodeSizes.get(id);
          if (s) return {w: s.width, h: s.height};
          const w = config.nodeWidth;
          const isCol = config.collapsedNodes?.has(id) ?? false;
          const h = isCol ? 36 : config.nodeHeight;
          nodeSizes.set(id, {width: w, height: h});
          return {w, h};
       }
       let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
       let hasChildren = false;
       for (const childId of children) {
          const p = positions.get(childId);
          if (p) {
             hasChildren = true;
             const s = calcSize(childId);
             if (p.x < minX) minX = p.x;
             if (p.x + s.w > maxX) maxX = p.x + s.w;
             if (p.y < minY) minY = p.y;
             if (p.y + s.h > maxY) maxY = p.y + s.h;
          }
       }
       if (hasChildren) {
          const pad = 20;
          const header = 40;
          const w = (maxX - minX) + pad * 2;
          const h = (maxY - minY) + header + pad;
          nodeSizes.set(id, {width: w, height: h});
          positions.set(id, {x: minX - pad, y: minY - header});
          return {w, h};
       } else {
          return {w: config.nodeWidth, h: config.nodeHeight};
       }
    };

    for (const id of graph.nodes.keys()) {
       if (layoutHierarchy.get(id)?.parent === null) {
          calcSize(id);
       }
    }
  }
  // -- End Compound Node Size Injection --

  return Object.freeze({
    positions,
    width,
    height,
    nodeSize: Object.freeze({
      width: config.nodeWidth,
      height: config.nodeHeight,
    }),
    nodeSizes: Object.freeze(nodeSizes),
    edgeRouting,
    hierarchy: hasHierarchy ? layoutHierarchy : undefined,
  });`;

code = code.replace(returnStatement, replacement);

const importRegex = /import type \{([^}]+)\} from "\.\/model";/;
const match = importRegex.exec(code);
if (match) {
    if (!match[1].includes('GraphSchema')) {
        code = code.replace(importRegex, `import type {${match[1]}, GraphSchema} from "./model";`);
    }
}

// Ensure the hierarchy property gets added ONCE correctly
let typeDef = `export interface LayoutSnapshot {`;
let replacementDef = `export interface LayoutSnapshot {\n  /**\n   * The hierarchical containment structure representing parent-child relationships.\n   */\n  readonly hierarchy?: ReadonlyMap<string, {\n    /** The parent node ID, or null if it's a root node. */\n    parent: string | null;\n    /** The list of child node IDs. */\n    children: string[]\n  }>;`;
if (!code.includes('readonly hierarchy?')) {
   code = code.replace(typeDef, replacementDef);
}

// Only replace first match for verticalLayout signature
code = code.replace(
  'export function verticalLayout(\n  graph: GraphSnapshot,\n  options: VerticalLayoutOptions = {},\n  previousLayout?: LayoutSnapshot,\n): LayoutSnapshot {',
  'export function verticalLayout(\n  graph: GraphSnapshot,\n  options: VerticalLayoutOptions = {},\n  previousLayout?: LayoutSnapshot,\n  schema?: GraphSchema\n): LayoutSnapshot {'
);

fs.writeFileSync('src/layout.ts', code);

let codeRenderer = fs.readFileSync('src/renderer.ts', 'utf8');

const regexRenderNodes = /function renderNodes\([\s\S]*?\): HTMLElement\[\] \{([\s\S]*?)function defaultNodeContent/m;
const newRenderNodes = `function renderNodes(
  graph: GraphSnapshot,
  layout: LayoutSnapshot,
  options: GraphViewOptions,
  collapsedNodes: ReadonlySet<string> = new Set(),
  schema?: GraphSchema,
  onToggleCollapse: (id: string) => void = () => {},
): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const renderedElements = new Map<string, HTMLElement>();

  const renderSingleNode = (nodeId: string): HTMLElement | null => {
    if (renderedElements.has(nodeId)) {
      return renderedElements.get(nodeId)!;
    }

    const node = graph.nodes.get(nodeId);
    if (!node) return null;

    const position = layout.positions.get(node.id);
    if (!position) return null;

    const isCompound = layout.hierarchy?.has(node.id) && layout.hierarchy.get(node.id)!.children.length > 0;

    const element = document.createElement("div");

    let className = isCompound ? "pgv-compound-node" : "graph-node pgv-graph-node";
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

    const nodeSize = layout.nodeSizes?.get(node.id) || layout.nodeSize;
    element.style.width = \`\${nodeSize.width}px\`;

    if (isCompound) {
      element.style.height = \`\${nodeSize.height}px\`;
    }

    const parentId = layout.hierarchy?.get(node.id)?.parent;
    if (parentId && layout.positions.has(parentId)) {
      const parentPos = layout.positions.get(parentId)!;
      element.style.transform = \`translate(\${position.x - parentPos.x}px, \${position.y - parentPos.y}px)\`;
    } else {
      element.style.transform = \`translate(\${position.x}px, \${position.y}px)\`;
    }

    if (isCompound) {
       const header = document.createElement("div");
       header.className = "pgv-compound-node-header";

       const title = document.createElement("div");
       title.className = "pgv-node-title";
       title.textContent = node.id;

       const toggleBtn = document.createElement("button");
       toggleBtn.className = "pgv-node-collapse-toggle";
       toggleBtn.title = "Collapse node (Disabled)";
       toggleBtn.setAttribute("aria-label", "Collapse node");
       toggleBtn.setAttribute("aria-expanded", "true");
       toggleBtn.disabled = true;
       toggleBtn.textContent = "[-]";

       header.append(title, toggleBtn);
       element.appendChild(header);

       const children = layout.hierarchy!.get(node.id)!.children;
       for (const childId of children) {
         const childEl = renderSingleNode(childId);
         if (childEl) {
           element.appendChild(childEl);
         }
       }
    } else if (isCollapsed) {
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

    renderedElements.set(nodeId, element);
    return element;
  };

  for (const nodeId of graph.nodes.keys()) {
    const parentId = layout.hierarchy?.get(nodeId)?.parent;
    if (!parentId) {
      const el = renderSingleNode(nodeId);
      if (el) {
        nodes.push(el);
      }
    }
  }

  return nodes;
}

`;

codeRenderer = codeRenderer.replace(regexRenderNodes, newRenderNodes + '\nfunction defaultNodeContent');

codeRenderer = codeRenderer.replace(
  'this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined);',
  'this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined, this.#schema);'
);
codeRenderer = codeRenderer.replace(
  'this.#layout =\n      this.#options.layout ?? verticalLayout(graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) });',
  'this.#layout =\n      this.#options.layout ?? verticalLayout(graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, undefined, this.#schema);'
);
codeRenderer = codeRenderer.replace(
  'this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined);',
  'this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined, this.#schema);'
);

fs.writeFileSync('src/renderer.ts', codeRenderer);

let codeStyle = fs.readFileSync('src/style.css', 'utf8');
const newStyles = `
/* Compound Nodes */
.pgv-compound-node {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  background-color: var(--pgv-color-bg-secondary, rgba(0, 0, 0, 0.03));
  border: 1px dashed var(--pgv-node-border, #d1d5db);
  border-radius: var(--pgv-node-radius, 8px);
  padding: 0;
  transition: transform var(--pgv-transition-speed) ease;
  will-change: transform;
}

.pgv-dark .pgv-compound-node {
  background-color: var(--pgv-color-bg-secondary, rgba(255, 255, 255, 0.05));
  border-color: var(--pgv-node-border, #4b5563);
}

.pgv-compound-node.pgv-selected {
  border-color: var(--pgv-selected-color, #2563eb);
  border-style: solid;
  border-width: 2px;
  box-shadow: 0 0 0 4px var(--pgv-selected-ring, rgba(37, 99, 235, 0.2));
}

.pgv-compound-node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--pgv-color-bg, #ffffff);
  border-bottom: 1px solid var(--pgv-node-border, #d1d5db);
  border-top-left-radius: var(--pgv-node-radius, 8px);
  border-top-right-radius: var(--pgv-node-radius, 8px);
  height: 40px;
  box-sizing: border-box;
}

.pgv-dark .pgv-compound-node-header {
  background-color: var(--pgv-color-bg, #1f2937);
  border-bottom-color: var(--pgv-node-border, #4b5563);
}

.pgv-compound-node-header .pgv-node-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--pgv-node-fg, #111827);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pgv-dark .pgv-compound-node-header .pgv-node-title {
  color: var(--pgv-node-fg, #f9fafb);
}

.pgv-compound-node-header .pgv-node-collapse-toggle {
  background: none;
  border: none;
  color: var(--pgv-node-fg-muted, #6b7280);
  cursor: not-allowed;
  font-family: monospace;
  font-size: 12px;
  padding: 0 4px;
  opacity: 0.5;
}
`;

if (!codeStyle.includes('.pgv-compound-node-header')) {
  fs.appendFileSync('src/style.css', '\n' + newStyles);
}

let specCode = fs.readFileSync('test/e2e/layout.spec.ts', 'utf8');

const newGraph = `
  test("Compound nodes structure", async ({ page }) => {
    await injectGraph(page, {
      schema: {
        containment: ["contains"]
      },
      nodes: [
        { id: "Parent", attributes: { "XCSG.name": "Parent" } },
        { id: "Child1", attributes: { "XCSG.name": "Child 1" } },
        { id: "Child2", attributes: { "XCSG.name": "Child 2" } },
        { id: "External", attributes: { "XCSG.name": "External" } }
      ],
      edges: [
        { id: "e1", source: "Parent", target: "Child1", tags: ["contains"] },
        { id: "e2", source: "Parent", target: "Child2", tags: ["contains"] },
        { id: "e3", source: "Child1", target: "Child2" },
        { id: "e4", source: "Child2", target: "External" }
      ],
    });

    const canvas = page.locator("#graph");
    await expect(canvas).toHaveScreenshot("layout-compound.png", {
      maxDiffPixels: 100,
    });
  });
`;

if (!specCode.includes("Compound nodes structure")) {
  specCode = specCode.substring(0, specCode.lastIndexOf('});')) + newGraph + '\n});\n';
  fs.writeFileSync('test/e2e/layout.spec.ts', specCode);
}

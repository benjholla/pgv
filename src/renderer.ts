import { edgeEndpoints, verticalLayout, type LayoutSnapshot, type VerticalLayoutOptions } from "./layout";
import type { AttributeValue, GraphEdge, GraphNode, GraphSnapshot } from "./model";

let markerIdSequence = 0;

export interface GraphViewOptions {
  readonly className?: string;
  readonly layout?: LayoutSnapshot;
  readonly layoutOptions?: VerticalLayoutOptions;
  readonly nodeContent?: (node: GraphNode) => HTMLElement | string;
  readonly edgeLabel?: (edge: GraphEdge) => string | null | undefined;
}

export class GraphView {
  readonly container: HTMLElement;

  #options: GraphViewOptions;
  #graph: GraphSnapshot | null = null;
  #layout: LayoutSnapshot | null = null;

  constructor(container: HTMLElement, options: GraphViewOptions = {}) {
    this.container = container;
    this.#options = options;
  }

  setGraph(graph: GraphSnapshot, options: GraphViewOptions = {}): void {
    this.#graph = graph;
    this.#options = { ...this.#options, ...options };
    this.#layout =
      this.#options.layout ?? verticalLayout(graph, this.#options.layoutOptions);

    this.#render();
  }

  destroy(): void {
    this.#graph = null;
    this.#layout = null;
    this.container.replaceChildren();
  }

  #render(): void {
    if (!this.#graph || !this.#layout) {
      return;
    }

    const graph = this.#graph;
    const layout = this.#layout;
    const root = document.createElement("div");

    root.className = joinClassNames("pgv-graph-view", this.#options.className);
    root.style.setProperty("--pgv-canvas-width", `${layout.width}px`);
    root.style.setProperty("--pgv-canvas-height", `${layout.height}px`);
    root.style.setProperty("--pgv-node-width", `${layout.nodeSize.width}px`);
    root.style.setProperty("--pgv-node-height", `${layout.nodeSize.height}px`);

    const stage = document.createElement("div");
    stage.className = "pgv-graph-stage";
    stage.style.width = `${layout.width}px`;
    stage.style.height = `${layout.height}px`;

    stage.appendChild(renderEdges(graph, layout, this.#options));
    stage.append(...renderNodes(graph, layout, this.#options));
    root.appendChild(stage);

    this.container.replaceChildren(root);
  }
}

export function renderGraph(
  container: HTMLElement,
  graph: GraphSnapshot,
  options: GraphViewOptions = {},
): GraphView {
  const view = new GraphView(container, options);
  view.setGraph(graph);
  return view;
}

export function tagToClassName(tag: string): string {
  const normalized = tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `tag-${normalized || "untagged"}`;
}

function renderEdges(
  graph: GraphSnapshot,
  layout: LayoutSnapshot,
  options: GraphViewOptions,
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const edgeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const markerId = `pgv-arrowhead-${markerIdSequence}`;

  markerIdSequence += 1;

  svg.classList.add("pgv-edge-layer");
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("width", `${layout.width}`);
  svg.setAttribute("height", `${layout.height}`);
  svg.setAttribute("aria-hidden", "true");

  svg.appendChild(createArrowMarker(markerId));
  edgeLayer.classList.add("pgv-edge-layer-inner");
  svg.appendChild(edgeLayer);

  for (const edge of graph.edges.values()) {
    const endpoints = edgeEndpoints(edge, layout);

    if (!endpoints) {
      continue;
    }

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const classNames = [
      "graph-edge",
      "pgv-graph-edge",
      ...edge.tags.map(tagToClassName),
    ];
    const curveMidY = endpoints.source.y + (endpoints.target.y - endpoints.source.y) / 2;
    const pathData = [
      `M ${endpoints.source.x} ${endpoints.source.y}`,
      `C ${endpoints.source.x} ${curveMidY}`,
      `${endpoints.target.x} ${curveMidY}`,
      `${endpoints.target.x} ${endpoints.target.y}`,
    ].join(" ");

    group.classList.add(...classNames);
    group.dataset.edgeId = edge.id;
    path.setAttribute("d", pathData);
    path.setAttribute("marker-end", `url(#${markerId})`);
    group.appendChild(path);

    const label = options.edgeLabel?.(edge) ?? defaultEdgeLabel(edge);

    if (label) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      text.classList.add("pgv-edge-label");
      text.setAttribute("x", `${(endpoints.source.x + endpoints.target.x) / 2}`);
      text.setAttribute("y", `${curveMidY - 8}`);
      text.textContent = label;
      group.appendChild(text);
    }

    edgeLayer.appendChild(group);
  }

  return svg;
}

function renderNodes(
  graph: GraphSnapshot,
  layout: LayoutSnapshot,
  options: GraphViewOptions,
): HTMLElement[] {
  const nodes: HTMLElement[] = [];

  for (const node of graph.nodes.values()) {
    const position = layout.positions.get(node.id);

    if (!position) {
      continue;
    }

    const element = document.createElement("div");

    element.className = joinClassNames(
      "graph-node",
      "pgv-graph-node",
      ...node.tags.map(tagToClassName),
    );
    element.dataset.nodeId = node.id;
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;

    const content = options.nodeContent?.(node) ?? defaultNodeContent(node);

    if (typeof content === "string") {
      element.textContent = content;
    } else {
      element.appendChild(content);
    }

    nodes.push(element);
  }

  return nodes;
}

function defaultNodeContent(node: GraphNode): HTMLElement {
  const content = document.createElement("div");
  const title = document.createElement("div");
  const id = document.createElement("div");
  const attributes = Object.entries(node.attributes).filter(
    ([key]) => key !== "label" && key !== "name",
  );

  content.className = "pgv-node-content";
  title.className = "pgv-node-title";
  title.textContent = attributeToText(node.attributes.label ?? node.attributes.name ?? node.id);
  id.className = "pgv-node-id";
  id.textContent = node.id;

  content.append(title, id);

  if (attributes.length > 0) {
    const list = document.createElement("dl");

    list.className = "pgv-node-attributes";

    for (const [key, value] of attributes.slice(0, 3)) {
      const term = document.createElement("dt");
      const description = document.createElement("dd");

      term.textContent = key;
      description.textContent = attributeToText(value);
      list.append(term, description);
    }

    content.appendChild(list);
  }

  return content;
}

function defaultEdgeLabel(edge: GraphEdge): string | null {
  const label = edge.attributes.label ?? edge.attributes.condition;

  return label === undefined ? null : attributeToText(label);
}

function createArrowMarker(markerId: string): SVGDefsElement {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("orient", "auto-start-reverse");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  path.setAttribute("fill", "#697586");
  marker.appendChild(path);
  defs.appendChild(marker);

  return defs;
}

function attributeToText(value: AttributeValue): string {
  if (typeof value === "bigint") {
    return value.toString();
  }

  return String(value);
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

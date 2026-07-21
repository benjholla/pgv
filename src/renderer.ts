/**
 * @module
 * @packageDocumentation
 * Interactive graph view and rendering logic using DOM and SVG.
 */

import { edgeEndpoints, verticalLayout, type LayoutSnapshot, type VerticalLayoutOptions } from "./layout";
import type { AttributeValue, GraphEdge, GraphNode, GraphSchema, GraphSnapshot } from "./model";
import { toSvg, toPng, toJpeg } from "html-to-image";

let markerIdSequence = 0;
const PGV_VIEWPORT_CLASS = "pgv-viewport";

const ATTRIBUTE_SEARCH_MODES = new Set(["node-attribute", "edge-attribute", "attribute"]);
const NODE_SEARCH_MODES = new Set(["all", "id", "node-id", "node-tag", "node-attribute", "tag", "attribute"]);
const EDGE_SEARCH_MODES = new Set(["all", "id", "edge-id", "edge-tag", "edge-attribute", "tag", "attribute"]);

const SEARCH_MODES = [
  { value: "all", label: "Everywhere" },
  { value: "node-id", label: "Node Id" },
  { value: "node-tag", label: "Node Tag" },
  { value: "node-attribute", label: "Node Attribute" },
  { value: "edge-id", label: "Edge Id" },
  { value: "edge-tag", label: "Edge Tag" },
  { value: "edge-attribute", label: "Edge Attribute" },
  { value: "id", label: "Element Id" },
  { value: "tag", label: "Element Tag" },
  { value: "attribute", label: "Element Attribute" }
];


/**
 * Represents the currently selected or highlighted elements in the graph view.
 *
 * This state is intentionally decoupled from the immutable `GraphSnapshot` model.
 * It strictly uses stable, producer-assigned IDs to track selection. This allows
 * selection states to persist across historical undo/redo actions, animations,
 * or when fetching entirely new backend snapshots that contain the same IDs.
 */
export interface SelectionState {
  /**
   * The set of selected node IDs.
   */
  readonly nodes: ReadonlySet<string>;
  /**
   * The set of selected edge IDs.
   */
  readonly edges: ReadonlySet<string>;
}

/**
 * Configuration options used to initialize or update a `GraphView`.
 *
 * This interface represents the primary public API for configuring visualization behavior.
 * It provides hooks to inject custom HTML renderers for nodes and edges, enable interactive
 * control layers (like minimaps, panning, searching, and history), and bind event listeners
 * to coordinate view state changes with a host application.
 */
export interface GraphViewOptions {
  /**
   * Additional CSS class names to apply to the root graph container.
   */
  readonly className?: string;

  /**
   * An optional pre-computed layout snapshot to use. If not provided, a default
   * vertical layout is generated.
   */
  readonly layout?: LayoutSnapshot;

  /**
   * Options to configure the default vertical layout if `layout` is not explicitly provided.
   */
  readonly layoutOptions?: VerticalLayoutOptions;

  /**
   * A function returning custom DOM content or a string for a given node.
   */
  readonly nodeContent?: (node: GraphNode) => HTMLElement | string;

  /**
   * A function returning a custom string label for a given edge, or null to hide it.
   */
  readonly edgeLabel?: (edge: GraphEdge) => string | null | undefined;

  /**
   * The current selection state determining which elements appear active.
   */
  readonly selection?: SelectionState;

  /**
   * The initial theme mode. Default is `"auto"` (follows system preferences).
   */
  readonly theme?: "light" | "dark" | "auto";

  /**
   * If true, enables interactive panning, zooming, and a minimap control layer.
   */
  readonly usePanZoom?: boolean;

  /**
   * If true, enables a built-in theme toggle control button.
   */
  readonly useThemeToggle?: boolean;

  /**
   * The maximum number of historical `GraphDiff` changes to keep in memory for
   * undo/redo navigation. Set to 0 to disable history tracking.
   */
  readonly maxHistory?: number;

  /**
   * If true, enables a multi-mode search panel for filtering nodes and edges.
   */
  readonly useSearch?: boolean;

  /**
   * Callback invoked when the user toggles the theme via the built-in control.
   */
  readonly onThemeChange?: (theme: "light" | "dark" | "auto") => void;

  /**
   * Callback invoked when a node is clicked or activated via keyboard.
   */
  readonly onNodeClick?: (nodeId: string, event: Event) => void;

  /**
   * Callback invoked when an edge is clicked or activated via keyboard.
   */
  readonly onEdgeClick?: (edgeId: string, event: Event) => void;

  /**
   * Callback invoked when a search action changes the active selection.
   */
  readonly onSelectionChange?: (selection: SelectionState) => void;

  /**
   * Callback invoked when the active graph state changes (e.g., via history navigation).
   */
  readonly onGraphChange?: (graph: GraphSnapshot) => void;
}

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

import { type GraphDiff, applyGraphDiff, graphSnapshotToJson } from "./model";

/**
 * The primary class responsible for mounting and managing the interactive
 * DOM representation of a graph.
 *
 * It coordinates the layout, HTML nodes, SVG edges, viewport transformations
 * (pan/zoom), control panels (minimap, search), and event listeners.
 *
 * **Important**: Be sure to call `destroy()` when removing the view to prevent memory leaks.
 *
 * @example
 * ```typescript
 * const container = document.getElementById("graph-container");
 * const view = new GraphView(container, { containment: ["contains"] }, {
 *   usePanZoom: true,
 *   theme: "light",
 *   onNodeClick: (nodeId) => console.log(`Clicked node ${nodeId}`)
 * });
 * view.setGraph(snapshot);
 *
 * // Later, when navigating away or unmounting:
 * // view.destroy();
 * ```
 */
export class GraphView {
  #clearSelectionBtn: HTMLButtonElement | null = null;
  #collapsedNodes: Set<string> = new Set();
  /**
   * The root DOM element containing the graph visualization.
   */
  readonly container: HTMLElement;

  readonly #schema: GraphSchema;
  #options: GraphViewOptions;
  #graph: GraphSnapshot | null = null;
  #layout: LayoutSnapshot | null = null;
  #viewportState: ViewportState = { x: 0, y: 0, scale: 1 };
  #panZoomAbortController: AbortController | null = null;
  #currentTheme: "light" | "dark" | "auto";
  #minimapOpen: boolean = false;
  #historyOpen: boolean = false;
  #firstRender: boolean = true;
  #minimapResizeObserver: ResizeObserver | null = null;
  #minimapAbortController: AbortController | null = null;
  #downloadFormat: "svg" | "png" | "jpeg" | "json" = "svg";
  #downloadDropdownOpen: boolean = false;
  #downloadAbortController: AbortController | null = null;
  #searchDropdownOpen: boolean = false;
  #searchAbortController: AbortController | null = null;

  #preHistoryGraph: GraphSnapshot | null = null;
  #history: Array<{ diff: GraphDiff }> = [];
  #historyIndex: number = -1;

  #controlsCollapsed: boolean = false;

  #searchOpen: boolean = false;
  #searchMode: "all" | "id" | "node-id" | "edge-id" | "node-tag" | "node-attribute" | "edge-tag" | "edge-attribute" | "tag" | "attribute" = "all";
  #searchQuery: string = "";
  #searchKeyQuery: string = "";
  #searchCaseSensitiveKey: boolean = false;
  #searchExactKey: boolean = false;
  #searchCaseSensitiveValue: boolean = false;
  #searchExactValue: boolean = false;
  #searchRegexKey: boolean = false;
  #searchRegexValue: boolean = false;
  #searchResults: Array<{ type: "node" | "edge", id: string }> = [];
  #searchCycleIndex: number = -1;
  #searchInputRef: HTMLInputElement | null = null;
  #searchKeyInputRef: HTMLInputElement | null = null;
  #updateSearchUI: (() => void) | null = null;
  #isDragging: boolean = false;

  /**
   * Initializes a new interactive graph visualization within the given DOM container.
   *
   * @param container The root DOM element where the graph view will be mounted.
   * @param schema Groundwork for future graph presentation details (e.g., semantic containment relationships).
   * @param options Optional configuration overrides to customize layout, behavior, and styling.
   */
  constructor(container: HTMLElement, schema: GraphSchema, options: GraphViewOptions = {}) {
    this.container = container;
    this.#schema = schema;
    this.#options = options;
    this.#currentTheme = options.theme ?? "auto";
  }

  /**
   * Completely replaces the current graph snapshot and resets view history.
   *
   * @param graph The new graph state to render.
   * @param options Optional configuration overrides.
   */
  setGraph(graph: GraphSnapshot, options: GraphViewOptions = {}): void {
    this.#preHistoryGraph = graph;
    this.#history = [];
    this.#historyIndex = -1;
    this.#graph = graph;
    this.#options = { ...this.#options, ...options };
    if (options.theme !== undefined) {
      this.#currentTheme = options.theme;
    }
    this.#layout =
      this.#options.layout ?? verticalLayout(graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, undefined, this.#schema);

    this.#render();

    if (this.#firstRender && this.#options.usePanZoom) {
      requestAnimationFrame(() => {
        this.#reset();
        this.#firstRender = false;
      });
    }
  }

  /**
   * Updates display options and selectively re-renders without destroying the
   * current graph state or diff history.
   *
   * @param options The specific configuration values to override.
   */
  updateOptions(options: Partial<GraphViewOptions>): void {
    const oldLayout = this.#options.layout;
    const oldLayoutOptions = this.#options.layoutOptions;

    this.#options = { ...this.#options, ...options };

    if (options.theme !== undefined) {
      this.#currentTheme = options.theme;
    }

    if (options.layout !== undefined && options.layout !== oldLayout) {
      this.#layout = options.layout;
    } else if (options.layoutOptions !== undefined && options.layoutOptions !== oldLayoutOptions && this.#graph) {
      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined, this.#schema);
    }
    if (this.#clearSelectionBtn) {
      this.#clearSelectionBtn.setAttribute("aria-disabled", !this.#options.selection || (this.#options.selection.nodes.size === 0 && this.#options.selection.edges.size === 0) ? "true" : "false");
      if (this.#clearSelectionBtn.getAttribute("aria-disabled") === "true") {
        this.#clearSelectionBtn.title = "No nodes or edges selected";
        this.#clearSelectionBtn.setAttribute("aria-label", "No nodes or edges selected");
      } else {
        this.#clearSelectionBtn.title = "Clear Selection";
        this.#clearSelectionBtn.setAttribute("aria-label", "Clear Selection");
      }
    }
    this.#render();
  }

  /**
   * Applies an incremental structural change to the current graph, tracking it in
   * the view history (if `maxHistory > 0`), and animating the transition.
   *
   * @param diff The incremental changes to apply.

   */
  applyDiff(diff: GraphDiff): void {
    if (!this.#graph || !this.#preHistoryGraph) {
      throw new Error("Cannot apply diff to an empty graph view.");
    }
    const maxHistory = this.#options.maxHistory ?? 0;

    if (this.#historyIndex < this.#history.length - 1) {
      // Are we viewing a past state?
      // "If the graph view is viewing a previous result and applying another graph diff would expire the current view then do not apply the graph diff"
      const expireCount = (this.#history.length + 1) - maxHistory;
      if (expireCount > 0 && this.#historyIndex < expireCount - 1) {
        throw new Error("Graph view is blocked. Applying diff would expire the currently viewed state.");
      }
    }

    this.#history.push({ diff });

    if (maxHistory > 0 && this.#history.length > maxHistory) {
      // Compress oldest history into preHistoryGraph
      const oldest = this.#history.shift()!;
      this.#preHistoryGraph = applyGraphDiff(this.#preHistoryGraph, oldest.diff);
      if (this.#historyIndex > -1) {
        this.#historyIndex--;
      }
    }

    if (this.#historyIndex === this.#history.length - 2) { // It was at the tip before pushing
      this.#historyIndex = this.#history.length - 1;
      this.#graph = applyGraphDiff(this.#graph, diff);
      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined, this.#schema);
      this.#options.onGraphChange?.(this.#graph);
      this.#render();
    } else {
      // The view does not update if we are viewing a previous result,
      // but the control panel buttons might need to re-render (right arrow might become enabled).
      this.#render();
    }
  }


  #compileMatcher(query: string, exact: boolean, caseSensitive: boolean, isRegex: boolean): (text: string) => boolean {
    if (!query) return () => false;

    if (isRegex) {
      try {
        let pattern = query;
        if (exact) {
          pattern = `\\b(?:${pattern})\\b`;
        }
        const flags = caseSensitive ? '' : 'i';
        const regex = new RegExp(pattern, flags);
        return (text: string) => text ? regex.test(text) : false;
      } catch (e) {
        // Invalid regex, silently fail match
        return () => false;
      }
    }

    if (exact) {
      const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = caseSensitive ? '' : 'i';
      const regex = new RegExp(`\\b${escapedQ}\\b`, flags);
      return (text: string) => text ? regex.test(text) : false;
    }

    if (caseSensitive) {
      return (text: string) => text ? text.includes(query) : false;
    } else {
      // PERF(Bolt): toLowerCase().includes() is ~1.6x faster than RegExp.test() for simple case-insensitive searches
      const queryLower = query.toLowerCase();
      return (text: string) => text ? text.toLowerCase().includes(queryLower) : false;
    }
  }

  #matchElement(
    element: GraphNode | GraphEdge,
    mode: string,
    type: "node" | "edge",
    valueMatcher: (text: string) => boolean,
    keyMatcher: (text: string) => boolean
  ): boolean {
    if (mode === "all") {
      if (valueMatcher(element.id)) return true;
      for (let i = 0; i < element.tags.length; i++) {
        if (valueMatcher(element.tags[i])) return true;
      }
      for (const k in element.attributes) {
        if (Object.prototype.hasOwnProperty.call(element.attributes, k)) {
          if (valueMatcher(k)) return true;
          const v = element.attributes[k];
          if (v !== null && typeof v !== 'object') {
            if (valueMatcher(String(v))) return true;
          }
        }
      }
      return false;
    } else if (mode === "id" || mode === `${type}-id`) {
      return valueMatcher(element.id);
    } else if (mode === `${type}-tag` || mode === "tag") {
      for (let i = 0; i < element.tags.length; i++) {
        if (valueMatcher(element.tags[i])) return true;
      }
      return false;
    } else if (mode === `${type}-attribute` || mode === "attribute") {
      for (const k in element.attributes) {
        if (Object.prototype.hasOwnProperty.call(element.attributes, k)) {
          const v = element.attributes[k];
          const keyMatch = !this.#searchKeyQuery || keyMatcher(k);
          if (keyMatch) {
            if (!this.#searchQuery) return true;
            if (v !== null && typeof v !== 'object' && valueMatcher(String(v))) return true;
          }
        }
      }
      return false;
    }
    return false;
  }

  #traverseSearchResults(
    valueMatcher: (text: string) => boolean,
    keyMatcher: (text: string) => boolean,
    onMatch: (type: "node" | "edge", id: string) => void
  ) {
    if (!this.#graph) return;

    const searchNodes = NODE_SEARCH_MODES.has(this.#searchMode);
    const searchEdges = EDGE_SEARCH_MODES.has(this.#searchMode);

    if (searchNodes) {
      for (const node of this.#graph.nodes.values()) {
        if (this.#matchElement(node, this.#searchMode, "node", valueMatcher, keyMatcher)) {
          onMatch("node", node.id);
        }
      }
    }

    if (searchEdges) {
      for (const edge of this.#graph.edges.values()) {
        if (this.#matchElement(edge, this.#searchMode, "edge", valueMatcher, keyMatcher)) {
          onMatch("edge", edge.id);
        }
      }
    }
  }

  #getPreviewCount(): number {
    if (!this.#graph) return 0;

    const isAttributeMode = ATTRIBUTE_SEARCH_MODES.has(this.#searchMode);
    if (!isAttributeMode && !this.#searchQuery) return 0;
    if (isAttributeMode && !this.#searchKeyQuery && !this.#searchQuery) return 0;

    const valueMatcher = this.#compileMatcher(this.#searchQuery, this.#searchExactValue, this.#searchCaseSensitiveValue, this.#searchRegexValue);
    const keyMatcher = this.#compileMatcher(this.#searchKeyQuery, this.#searchExactKey, this.#searchCaseSensitiveKey, this.#searchRegexKey);

    let count = 0;
    this.#traverseSearchResults(valueMatcher, keyMatcher, () => count++);
    return count;
  }

  #executeSearch(): void {
    if (!this.#graph) return;

    const isAttributeMode = ATTRIBUTE_SEARCH_MODES.has(this.#searchMode);
    const isQueryEmpty = isAttributeMode ? (!this.#searchKeyQuery && !this.#searchQuery) : (!this.#searchQuery);

    if (isQueryEmpty) {
      this.#searchResults = [];
      this.#searchCycleIndex = -1;
      this.#options.onSelectionChange?.({ nodes: new Set(), edges: new Set() });
      this.#render();
      this.#updateSearchUI?.();
      return;
    }

    const valueMatcher = this.#compileMatcher(this.#searchQuery, this.#searchExactValue, this.#searchCaseSensitiveValue, this.#searchRegexValue);
    const keyMatcher = this.#compileMatcher(this.#searchKeyQuery, this.#searchExactKey, this.#searchCaseSensitiveKey, this.#searchRegexKey);

    const matchedNodes = new Set<string>();
    const matchedEdges = new Set<string>();
    this.#searchResults = [];

    this.#traverseSearchResults(valueMatcher, keyMatcher, (type, id) => {
      if (type === "node") matchedNodes.add(id);
      else matchedEdges.add(id);
      this.#searchResults.push({ type, id });
    });

    this.#searchCycleIndex = this.#searchResults.length > 0 ? 0 : -1;
    this.#options.onSelectionChange?.({ nodes: matchedNodes, edges: matchedEdges });

    if (this.#searchResults.length > 0) {
      this.#focusSearchResult();
    }

    this.#render();
    this.#updateSearchUI?.();
  }

  #cycleSearch(): void {
    if (this.#searchResults.length === 0) return;
    this.#searchCycleIndex = (this.#searchCycleIndex + 1) % this.#searchResults.length;
    this.#focusSearchResult();
    this.#render();
    this.#updateSearchUI?.();
  }

  #focusSearchResult(): void {
    if (!this.#layout || this.#searchCycleIndex < 0 || this.#searchCycleIndex >= this.#searchResults.length) return;

    const result = this.#searchResults[this.#searchCycleIndex];
    this.#centerOnGraphElement(result.type, result.id);
  }

  #centerOnGraphElement(type: "node" | "edge", id: string): void {
    if (!this.#layout) return;

    let focusX = 0;
    let focusY = 0;

    if (type === "node") {
      const pos = this.#layout.positions.get(id);
      if (pos) {
        focusX = pos.x + this.#layout.nodeSize.width / 2;
        focusY = pos.y + this.#layout.nodeSize.height / 2;
      }
    } else {
      const edge = this.#graph?.edges.get(id);
      if (edge) {
        const sourcePos = this.#layout.positions.get(edge.source);
        const targetPos = this.#layout.positions.get(edge.target);
        if (sourcePos && targetPos) {
          // Focus shifted slightly from source node towards target
          focusX = sourcePos.x + this.#layout.nodeSize.width / 2 + (targetPos.x - sourcePos.x) * 0.1;
          focusY = sourcePos.y + this.#layout.nodeSize.height / 2 + (targetPos.y - sourcePos.y) * 0.1;
        }
      }
    }

    if (focusX > 0 || focusY > 0) {
      const viewportElement = this.container.querySelector('.pgv-viewport');
      if (viewportElement) {
        const vw = viewportElement.clientWidth;
        const vh = viewportElement.clientHeight;

        this.#viewportState.scale = 1;
        this.#viewportState.x = vw / 2 - focusX;
        this.#viewportState.y = vh / 2 - focusY;
        this.#applyViewport();
      }
    }
  }

  #navigateHistory(direction: "left" | "right" | "fast-forward" | "fast-rewind"): void {
    if (!this.#preHistoryGraph) return;

    if (direction === "left") {
      if (this.#historyIndex > -1) {
        this.#historyIndex--;
      }
    } else if (direction === "right") {
      if (this.#historyIndex < this.#history.length - 1) {
        this.#historyIndex++;
      }
    } else if (direction === "fast-forward") {
      this.#historyIndex = this.#history.length - 1;
    } else if (direction === "fast-rewind") {
      this.#historyIndex = -1;
    }

    let current = this.#preHistoryGraph;
    for (let i = 0; i <= this.#historyIndex; i++) {
      const h = this.#history[i];
      current = applyGraphDiff(current, h.diff);
    }

    this.#graph = current;
    this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined, this.#schema);
    this.#options.onGraphChange?.(this.#graph);
    this.#render();
  }

  #toggleNodeCollapse(id: string): void {
    if (this.#collapsedNodes.has(id)) {
      this.#collapsedNodes.delete(id);
    } else {
      this.#collapsedNodes.add(id);
    }
    if (this.#graph) {
      this.#layout = verticalLayout(this.#graph, { ...this.#options.layoutOptions, collapsedNodes: this.#collapsedNodes, containmentTags: new Set(this.#schema.containment || []) }, this.#layout ?? undefined, this.#schema);
      this.#render();
    }
  }

  /**
   * Cleans up all resources, abort controllers, observers, and removes DOM elements.
   * Must be called when the view is no longer needed to prevent memory leaks.
   */
  destroy(): void {
    this.#graph = null;
    this.#layout = null;
    this.#panZoomAbortController?.abort();
    this.#panZoomAbortController = null;
    this.#minimapResizeObserver?.disconnect();
    this.#minimapResizeObserver = null;
    this.#minimapAbortController?.abort();
    this.#minimapAbortController = null;
    this.#downloadAbortController?.abort();
    this.#downloadAbortController = null;
    this.container.replaceChildren();
  }

  #render(): void {
    const activePlaceholder = document.activeElement && this.container.contains(document.activeElement) && document.activeElement.tagName === "INPUT" ? (document.activeElement as any).placeholder : null;
    if (!this.#graph || !this.#layout) {
      return;
    }

    const graph = this.#graph;
    const layout = this.#layout;
    const root = document.createElement("div");

    let className = "pgv-graph-view";
    if (this.#options.usePanZoom) className += " pgv-pan-zoom";
    if (this.#currentTheme === "light") className += " pgv-light";
    if (this.#currentTheme === "dark") className += " pgv-dark";
    if (this.#options.className) className += " " + this.#options.className;
    root.className = className;
    root.style.setProperty("--pgv-canvas-width", `${layout.width}px`);
    root.style.setProperty("--pgv-canvas-height", `${layout.height}px`);
    root.style.setProperty("--pgv-node-width", `${layout.nodeSize.width}px`);
    root.style.setProperty("--pgv-node-height", `${layout.nodeSize.height}px`);

    const stage = document.createElement("div");
    stage.className = "pgv-graph-stage";
    stage.style.width = `${layout.width}px`;
    stage.style.height = `${layout.height}px`;

    // We append nodes first then edges in the DOM to ensure natural
    // keyboard tabbing order (nodes then edges) while keeping z-index
    // responsible for visual stacking.
    stage.append(...renderNodes(graph, layout, this.#options, this.#collapsedNodes, this.#schema, (id) => this.#toggleNodeCollapse(id)));
    stage.appendChild(renderEdges(graph, layout, this.#options, this.#schema));

    if (this.#options.usePanZoom || this.#options.useThemeToggle || (this.#options.maxHistory && this.#options.maxHistory > 0)) {
      const viewport = document.createElement("div");
      viewport.className = PGV_VIEWPORT_CLASS;

      stage.style.transform = `translate(${this.#viewportState.x}px, ${this.#viewportState.y}px) scale(${this.#viewportState.scale})`;
      stage.style.transformOrigin = "0 0";

      viewport.appendChild(stage);

      // Append controls *before* viewport to ensure natural tabbing sequence
      // enters controls first, and graph elements last.

      const topContainer = document.createElement("div");
      topContainer.className = "pgv-top-container";

      if (this.#searchOpen) {
        topContainer.appendChild(this.#renderSearchControls());
        root.appendChild(topContainer);
      }

      const bottomContainer = document.createElement("div");
      bottomContainer.className = "pgv-bottom-container";

      bottomContainer.appendChild(this.#renderControls());

      if (bottomContainer.children.length > 0) {
        root.appendChild(bottomContainer);
      }

      if (this.#options.maxHistory && this.#options.maxHistory > 0) {
      }

      root.appendChild(viewport);

      if (this.#options.usePanZoom) {
        this.#panZoomAbortController?.abort();
        this.#panZoomAbortController = new AbortController();
        this.#setupPanZoomEvents(viewport, this.#panZoomAbortController.signal);
      }
    } else {
      root.appendChild(stage);
    }

    this.#setupEvents(root);

    this.container.replaceChildren(root);

    // Restore focus to avoid interrupting typing
    if (activePlaceholder) {
      if (activePlaceholder.endsWith("Key...") && this.#searchKeyInputRef) {
        this.#searchKeyInputRef.focus();
        this.#searchKeyInputRef.setSelectionRange(this.#searchKeyInputRef.value.length, this.#searchKeyInputRef.value.length);
      } else if (this.#searchInputRef) {
        this.#searchInputRef.focus();
        this.#searchInputRef.setSelectionRange(this.#searchInputRef.value.length, this.#searchInputRef.value.length);
      }
    }
  }



  #createSearchToggle(label: string, active: boolean, iconHtml: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `pgv-search-toggle ${active ? "active" : ""}`;
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.innerHTML = iconHtml;
    // We remove the inline style for width/height so CSS can manage the sizes and media queries
    btn.addEventListener("click", () => {
      onClick();
      btn.classList.toggle("active");
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
    });
    return btn;
  }

  #createSearchInputGroup(
    modeLabel: string,
    isKey: boolean,
    isAttributeMode: boolean,
    initialValue: string,
    onInput: (val: string) => void,
    onEnter: (e: KeyboardEvent) => void,
    onClear: () => void,
    options: {
      caseSensitive: boolean;
      exact: boolean;
      regex: boolean;
      onCaseSensitiveChange: () => void;
      onExactChange: () => void;
      onRegexChange: () => void;
    }
  ): { wrapper: HTMLDivElement, input: HTMLInputElement } {
    const wrapper = document.createElement("div");
    wrapper.className = "pgv-search-input-wrapper";

    const innerWrapper = document.createElement("div");
    innerWrapper.className = "pgv-search-input-inner";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1000;
    const label = isKey ? `Search ${modeLabel} Key` : (isAttributeMode ? `Search ${modeLabel} Value` : `Search ${modeLabel}`);
    input.setAttribute("aria-label", label);
    input.placeholder = `${label}...`;
    input.value = initialValue;

    const clearBtn = document.createElement("button");
    clearBtn.className = "pgv-search-clear-btn";
    clearBtn.type = "button";
    clearBtn.setAttribute("aria-label", "Clear search");
    clearBtn.title = "Clear";
    clearBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`;

    const updateClearBtn = () => {
      clearBtn.style.display = input.value ? "flex" : "none";
    };
    updateClearBtn();

    input.addEventListener("input", (e) => {
      onInput((e.target as HTMLInputElement).value);
      updateClearBtn();
    });
    input.addEventListener("keydown", onEnter);

    clearBtn.addEventListener("click", () => {
      input.value = "";
      updateClearBtn();
      onClear();
      input.focus();
    });

    innerWrapper.appendChild(input);
    innerWrapper.appendChild(clearBtn);
    wrapper.appendChild(innerWrapper);

    const toggles = document.createElement("div");
    toggles.className = "pgv-search-toggles";
    const matchCaseIcon = `Aa`;
    const matchWholeWordIcon = `<span style="text-decoration: underline; font-style: normal; font-family: monospace;">ab</span>`;
    const matchRegexIcon = `.*`;

    toggles.appendChild(this.#createSearchToggle("Match Case", options.caseSensitive, matchCaseIcon, options.onCaseSensitiveChange));
    toggles.appendChild(this.#createSearchToggle("Match Whole Word", options.exact, matchWholeWordIcon, options.onExactChange));
    toggles.appendChild(this.#createSearchToggle("Use Regular Expression", options.regex, matchRegexIcon, options.onRegexChange));
    wrapper.appendChild(toggles);

    return { wrapper, input };
  }

  #renderSearchModeDropdown(bar: HTMLElement): HTMLElement {


    const searchDropdownContainer = document.createElement("div");
    searchDropdownContainer.className = "pgv-search-dropdown-container";

    const dropdownBtn = document.createElement("button");
    dropdownBtn.type = "button";
    dropdownBtn.className = "pgv-search-dropdown-btn";
    dropdownBtn.setAttribute("aria-label", "Search mode");
    dropdownBtn.setAttribute("title", "Search mode");
    dropdownBtn.setAttribute("aria-haspopup", "menu");
    dropdownBtn.setAttribute("aria-controls", "pgv-search-dropdown-menu");
    dropdownBtn.setAttribute("aria-expanded", this.#searchDropdownOpen ? "true" : "false");
    const icons = { chevronDown: "M6 9l6 6 6-6" };
    dropdownBtn.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="${icons.chevronDown}"></path>
      </svg>
    `;
    searchDropdownContainer.appendChild(dropdownBtn);

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "pgv-dropdown-menu";
    dropdownMenu.id = "pgv-search-dropdown-menu";
    dropdownMenu.setAttribute("role", "menu");
    if (this.#searchDropdownOpen) {
      dropdownMenu.classList.add("open");
    }

    for (let i = 0; i < SEARCH_MODES.length; i++) {
      const mode = SEARCH_MODES[i];
      const option = document.createElement("div");
      option.className = "pgv-dropdown-option";
      option.setAttribute("role", "menuitemradio");
      option.dataset.value = mode.value;
      option.setAttribute("tabindex", "0");
      if (this.#searchMode === mode.value) {
        option.setAttribute("aria-checked", "true");
        option.classList.add("selected");
      } else {
        option.setAttribute("aria-checked", "false");
      }
      option.textContent = mode.label;

      option.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          option.click();
        } else if (e.key === "Escape") {
          this.#searchDropdownOpen = false;
          dropdownBtn.setAttribute("aria-expanded", "false");
          dropdownMenu.classList.remove("open");
          dropdownBtn.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = option.nextElementSibling as HTMLElement | null;
          if (next) {
            next.focus();
          } else {
            (dropdownMenu.firstElementChild as HTMLElement)?.focus();
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = option.previousElementSibling as HTMLElement | null;
          if (prev) {
            prev.focus();
          } else {
            (dropdownMenu.lastElementChild as HTMLElement)?.focus();
          }
        }
      });

      option.addEventListener("click", () => {
        this.#searchMode = mode.value as any;
        this.#searchDropdownOpen = false;
        dropdownBtn.setAttribute("aria-expanded", "false");
        dropdownMenu.classList.remove("open");

        this.#searchResults = [];
        this.#searchCycleIndex = -1;

        // Re-render
        const parent = bar.parentElement;
        if (parent) {
          const newBar = this.#renderSearchControls();
          parent.replaceChild(newBar, bar);
          const newBtn = newBar.querySelector(".pgv-search-dropdown-btn") as HTMLElement;
          if (newBtn) {
            newBtn.focus();
          }
        }
      });
      dropdownMenu.appendChild(option);
    }
    searchDropdownContainer.appendChild(dropdownMenu);

    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#searchDropdownOpen = !this.#searchDropdownOpen;
      dropdownBtn.setAttribute("aria-expanded", this.#searchDropdownOpen ? "true" : "false");
      if (this.#searchDropdownOpen) {
        dropdownMenu.classList.add("open");
        const firstOption = dropdownMenu.querySelector('.pgv-dropdown-option') as HTMLElement;
        if (firstOption) {
          firstOption.focus();
        }
      } else {
        dropdownMenu.classList.remove("open");
      }
    });

    dropdownMenu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.#searchDropdownOpen = false;
        dropdownBtn.setAttribute("aria-expanded", "false");
        dropdownMenu.classList.remove("open");
        dropdownBtn.focus();
      }
    });

    this.#searchAbortController?.abort();
    this.#searchAbortController = new AbortController();
    document.addEventListener("click", () => {
      if (this.#searchDropdownOpen) {
        this.#searchDropdownOpen = false;
        dropdownBtn.setAttribute("aria-expanded", "false");
        dropdownMenu.classList.remove("open");
      }
    }, { signal: this.#searchAbortController.signal });

    return searchDropdownContainer;
  }

  #renderSearchControls(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "pgv-search-bar";

    const searchDropdownContainer = this.#renderSearchModeDropdown(bar);
    bar.appendChild(searchDropdownContainer);

    const inputsContainer = document.createElement("div");
    inputsContainer.className = "pgv-search-inputs";

    const isAttributeMode = ATTRIBUTE_SEARCH_MODES.has(this.#searchMode);

    // We get modes label again, but it's fine since we abstracted dropdown

    const modeLabel = SEARCH_MODES.find(m => m.value === this.#searchMode)?.label || "Everywhere";

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (this.#searchResults.length > 0) {
          this.#cycleSearch();
        } else {
          this.#executeSearch();
        }
      }
    };

    const info = document.createElement("div");
    info.className = "pgv-search-results-info";
    info.setAttribute("aria-live", "polite");
    info.setAttribute("aria-atomic", "true");

    const searchBtn = document.createElement("button");
    searchBtn.type = "button";
    searchBtn.title = "Search";
    searchBtn.setAttribute("aria-label", "Execute search");
    searchBtn.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    searchBtn.addEventListener("click", () => {
      if (searchBtn.getAttribute("aria-disabled") === "true") return;
      this.#executeSearch();
    });

    const cycleBtn = document.createElement("button");
    cycleBtn.type = "button";
    cycleBtn.title = "Cycle Results";
    cycleBtn.setAttribute("aria-label", "Cycle search results");
    cycleBtn.setAttribute("aria-disabled", this.#searchResults.length === 0 ? "true" : "false");
    cycleBtn.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
    `;

    const updateSearchBtnState = () => {
      const isQueryEmpty = isAttributeMode
        ? (!this.#searchKeyQuery && !this.#searchQuery)
        : (!this.#searchQuery);

      searchBtn.setAttribute("aria-disabled", isQueryEmpty ? "true" : "false");
      searchBtn.title = isQueryEmpty ? "Enter a query to search" : "Search";
      searchBtn.setAttribute("aria-label", searchBtn.title);
      cycleBtn.setAttribute("aria-disabled", this.#searchResults.length === 0 ? "true" : "false");
      cycleBtn.title = this.#searchResults.length === 0 ? "No results to cycle" : "Cycle Results";
      cycleBtn.setAttribute("aria-label", cycleBtn.title);

      if (isQueryEmpty) {
        info.textContent = "";
      } else if (this.#searchResults.length > 0) {
        info.textContent = `${this.#searchCycleIndex + 1} of ${this.#searchResults.length}`;
      } else {
        const previewCount = this.#getPreviewCount();
        info.textContent = `${previewCount} result${previewCount === 1 ? '' : 's'}`;
      }
    };
    updateSearchBtnState();
    this.#updateSearchUI = updateSearchBtnState;

    if (isAttributeMode) {
      const keyGroup = this.#createSearchInputGroup(
        modeLabel,
        true,
        true, // isAttributeMode is always true if this block runs
        this.#searchKeyQuery,
        (val) => {
          this.#searchKeyQuery = val;
          this.#searchResults = [];
          this.#searchCycleIndex = -1;
          updateSearchBtnState();
        },
        handleEnter,
        () => {
          this.#searchKeyQuery = "";
          this.#searchResults = [];
          this.#searchCycleIndex = -1;
          this.#options.onSelectionChange?.({ nodes: new Set(), edges: new Set() });
          this.#executeSearch();
          updateSearchBtnState();
        },
        {
          caseSensitive: this.#searchCaseSensitiveKey,
          exact: this.#searchExactKey,
          regex: this.#searchRegexKey,
          onCaseSensitiveChange: () => {
            this.#searchCaseSensitiveKey = !this.#searchCaseSensitiveKey;
            this.#searchResults = [];
            this.#searchCycleIndex = -1;
            updateSearchBtnState();
          },
          onExactChange: () => {
            this.#searchExactKey = !this.#searchExactKey;
            this.#searchResults = [];
            this.#searchCycleIndex = -1;
            updateSearchBtnState();
          },
          onRegexChange: () => {
            this.#searchRegexKey = !this.#searchRegexKey;
            this.#searchResults = [];
            this.#searchCycleIndex = -1;
            updateSearchBtnState();
          }
        }
      );
      this.#searchKeyInputRef = keyGroup.input;
      inputsContainer.appendChild(keyGroup.wrapper);
    }

    const valueGroup = this.#createSearchInputGroup(
      modeLabel,
      false,
      isAttributeMode,
      this.#searchQuery,
      (val) => {
        this.#searchQuery = val;
        this.#searchResults = [];
        this.#searchCycleIndex = -1;
        updateSearchBtnState();
      },
      handleEnter,
      () => {
        this.#searchQuery = "";
        this.#searchResults = [];
        this.#searchCycleIndex = -1;
        this.#options.onSelectionChange?.({ nodes: new Set(), edges: new Set() });
        this.#executeSearch();
        updateSearchBtnState();
      },
      {
        caseSensitive: this.#searchCaseSensitiveValue,
        exact: this.#searchExactValue,
        regex: this.#searchRegexValue,
        onCaseSensitiveChange: () => {
          this.#searchCaseSensitiveValue = !this.#searchCaseSensitiveValue;
          this.#searchResults = [];
          this.#searchCycleIndex = -1;
          updateSearchBtnState();
        },
        onExactChange: () => {
          this.#searchExactValue = !this.#searchExactValue;
          this.#searchResults = [];
          this.#searchCycleIndex = -1;
          updateSearchBtnState();
        },
        onRegexChange: () => {
          this.#searchRegexValue = !this.#searchRegexValue;
          this.#searchResults = [];
          this.#searchCycleIndex = -1;
          updateSearchBtnState();
        }
      }
    );
    this.#searchInputRef = valueGroup.input;
    inputsContainer.appendChild(valueGroup.wrapper);

    bar.appendChild(inputsContainer);

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "pgv-search-actions";

    cycleBtn.addEventListener("click", () => {
      if (cycleBtn.getAttribute("aria-disabled") === "true") return;
      if (this.#searchResults.length > 0) {
        this.#cycleSearch();
      } else {
        this.#executeSearch();
      }
    });

    actionsContainer.appendChild(searchBtn);
    actionsContainer.appendChild(cycleBtn);
    actionsContainer.appendChild(info);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.title = "Close Search (Esc)";
    closeBtn.setAttribute("aria-label", "Close Search");
    closeBtn.style.marginLeft = "auto";
    closeBtn.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    const handleClose = () => {
      this.#searchOpen = false;
      this.#render();
      requestAnimationFrame(() => {
        const toggleBtn = this.container.querySelector(".pgv-search-toggle-btn") as HTMLButtonElement | null;
        if (toggleBtn) {
          toggleBtn.focus();
        }
      });
    };

    closeBtn.addEventListener("click", handleClose);
    actionsContainer.appendChild(closeBtn);
    bar.appendChild(actionsContainer);

    bar.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    });

    return bar;
  }

  #renderHistoryPanel(): HTMLElement {
    const controls = document.createElement("div");
    controls.className = `pgv-history-panel ${this.#historyOpen ? "pgv-history-panel-open" : ""}`;

    const icons = {
      left: "M15 18l-6-6 6-6",
      right: "M9 18l6-6-6-6",
      fastForward: "M13 18l6-6-6-6M5 18l6-6-6-6",
      fastRewind: "M11 18l-6-6 6-6M19 18l-6-6 6-6",
    };

    const rwBtn = this.#createControlButton({
      icon: icons.fastRewind,
      action: () => this.#navigateHistory("fast-rewind"),
      label: "Earliest Graph Snapshot",
    });

    const leftBtn = this.#createControlButton({
      icon: icons.left,
      action: () => this.#navigateHistory("left"),
      label: "Previous Graph Snapshot",
    });

    if (this.#historyIndex === -1) {
      leftBtn.setAttribute("aria-disabled", "true");

      leftBtn.title = "No previous snapshots available";
      leftBtn.setAttribute("aria-label", "No previous snapshots available");
      rwBtn.setAttribute("aria-disabled", "true");

      rwBtn.title = "Already at earliest snapshot";
      rwBtn.setAttribute("aria-label", "Already at earliest snapshot");
    }

    const rightBtn = this.#createControlButton({
      icon: icons.right,
      action: () => this.#navigateHistory("right"),
      label: "Next Graph Snapshot",
    });

    const ffBtn = this.#createControlButton({
      icon: icons.fastForward,
      action: () => this.#navigateHistory("fast-forward"),
      label: "Latest Graph Snapshot",
    });

    if (this.#historyIndex >= this.#history.length - 1) {
      rightBtn.setAttribute("aria-disabled", "true");

      rightBtn.title = "No newer snapshots available";
      rightBtn.setAttribute("aria-label", "No newer snapshots available");
      ffBtn.setAttribute("aria-disabled", "true");

      ffBtn.title = "Already at latest snapshot";
      ffBtn.setAttribute("aria-label", "Already at latest snapshot");
    }

    controls.appendChild(rwBtn);
    controls.appendChild(leftBtn);
    controls.appendChild(rightBtn);
    controls.appendChild(ffBtn);

    return controls;
  }

  #renderControls(): HTMLElement {
    const controls = document.createElement("div");
    controls.className = "pgv-controls";

    const icons = {
      eraser: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M8 12h8",
      plus: "M12 5v14m-7-7h14",
      minus: "M5 12h14",
      up: "M12 19V5m-7 7 7-7 7 7",
      down: "M12 5v14m-7-7 7 7 7-7",
      left: "M19 12H5m7 7-7-7 7-7",
      right: "M5 12h14m-7 7 7-7-7-7",
      reset: "M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M12 12L12 12",
      sun: "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M3 12h1M20 12h1M12 3v1M12 20v1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 17.7l.7-.7M17.7 5.6l-.7.7",
      moon: "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",
      auto: "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z M12 2v20",
      map: "M9 20v-14l-4 2v14l4 -2zM15 4v14l4 -2v-14l-4 2zM9 20l6 -2v-14l-6 2z",
      download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
      chevronDown: "M6 9l6 6 6-6",
      search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      collapse: "M10 10L4 4M10 10V5M10 10H5M14 14l6 6M14 14v5M14 14h5", // implosion (inward arrows)
      expand: "M20 4L14 10M20 4v5M20 4h-5M4 20l6-6M4 20v-5M4 20h5",   // explosion (outward arrows)
      placeholder: ""
    };

    if (this.#controlsCollapsed) {
      const expandBtn = this.#createControlButton({
        icon: icons.expand,
        action: () => {
          this.#controlsCollapsed = false;
          this.#render();
        },
        label: "Expand Controls",
      });
      expandBtn.setAttribute("aria-expanded", "false");
      controls.appendChild(expandBtn);
      return controls;
    }

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "pgv-controls-buttons";

    if (this.#options.usePanZoom) {
      const zoomButtons = [
        { id: "zoom-in", icon: icons.plus, action: () => this.#zoom(0.1), label: "Zoom In" },
        { id: "zoom-out", icon: icons.minus, action: () => this.#zoom(-0.1), label: "Zoom Out" },
      ];

      const panButtons = [
        { id: "pan-up", icon: icons.up, action: () => this.#pan(0, 40), gridArea: "pan-up", label: "Pan Up" },
        { id: "pan-left", icon: icons.left, action: () => this.#pan(40, 0), gridArea: "pan-left", label: "Pan Left" },
        { id: "reset", icon: icons.reset, action: () => this.#reset(), gridArea: "reset", label: "Reset View" },
        { id: "pan-right", icon: icons.right, action: () => this.#pan(-40, 0), gridArea: "pan-right", label: "Pan Right" },
        { id: "pan-down", icon: icons.down, action: () => this.#pan(0, -40), gridArea: "pan-down", label: "Pan Down" },
      ];

      const zoomGroup = document.createElement("div");
      zoomGroup.className = "pgv-control-group pgv-zoom-group";
      for (const btn of zoomButtons) {
        zoomGroup.appendChild(this.#createControlButton(btn));
      }

      const panGroup = document.createElement("div");
      panGroup.className = "pgv-control-group pgv-pan-group";
      for (const btn of panButtons) {
        const button = this.#createControlButton(btn);
        button.classList.add(`pgv-btn-${btn.id}`);
        button.style.gridArea = btn.gridArea!;
        panGroup.appendChild(button);
      }

      buttonsContainer.append(zoomGroup, panGroup);
    }

    const miscGroup = document.createElement("div");
      miscGroup.className = "pgv-misc-group";

      const topButtonsContainer = document.createElement("div");
      topButtonsContainer.className = "pgv-misc-top-buttons";

      // Row 1: Search, History, Minimap
      const searchToggleBtn = this.#createControlButton({
        icon: icons.search,
        action: () => {
          this.#searchOpen = !this.#searchOpen;
          this.#render();
          if (this.#searchOpen) {
            requestAnimationFrame(() => {
              if (this.#searchMode === "node-attribute" || this.#searchMode === "edge-attribute" || this.#searchMode === "attribute") {
                this.#searchKeyInputRef?.focus();
              } else {
                this.#searchInputRef?.focus();
              }
            });
          }
        },
        label: "Toggle Search",
      });
      searchToggleBtn.classList.add("pgv-search-toggle-btn");
      searchToggleBtn.setAttribute("aria-expanded", this.#searchOpen ? "true" : "false");
      topButtonsContainer.appendChild(searchToggleBtn);

      if (this.#options.maxHistory && this.#options.maxHistory > 0) {
        const historyToggleBtn = this.#createControlButton({
          icon: icons.history,
          action: () => {
            this.#historyOpen = !this.#historyOpen;
            this.#render();
          },
          label: "Toggle History Navigation",
        });

        historyToggleBtn.setAttribute("aria-expanded", this.#historyOpen ? "true" : "false");
        topButtonsContainer.appendChild(historyToggleBtn);
      }

      if (this.#options.usePanZoom) {
        const minimapToggleBtn = this.#createControlButton({
          icon: icons.map,
          action: () => this.#toggleMinimap(),
          label: "Toggle Minimap",
        });
        minimapToggleBtn.setAttribute("aria-expanded", this.#minimapOpen ? "true" : "false");
        topButtonsContainer.appendChild(minimapToggleBtn);

        const mobileResetBtn = this.#createControlButton({
          icon: icons.reset,
          action: () => this.#reset(),
          label: "Reset View",
        });
        mobileResetBtn.classList.add("pgv-mobile-reset-btn");
        topButtonsContainer.appendChild(mobileResetBtn);
      }

      // Row 2: Clear, Theme, Future Placeholder
      this.#clearSelectionBtn = this.#createControlButton({
        icon: icons.eraser,
        action: () => {
          this.#options.onSelectionChange?.({ nodes: new Set(), edges: new Set() });
        },
        label: "Clear Selection",
      });
      this.#clearSelectionBtn.setAttribute("aria-disabled", !this.#options.selection || (this.#options.selection.nodes.size === 0 && this.#options.selection.edges.size === 0) ? "true" : "false");
      if (this.#clearSelectionBtn.getAttribute("aria-disabled") === "true") {
        this.#clearSelectionBtn.title = "No nodes or edges selected";
        this.#clearSelectionBtn.setAttribute("aria-label", "No nodes or edges selected");
      }
      topButtonsContainer.appendChild(this.#clearSelectionBtn);

      if (this.#options.useThemeToggle) {
        const themeIcon = this.#currentTheme === "light" ? icons.sun : this.#currentTheme === "dark" ? icons.moon : icons.auto;
        const themeLabel = `Theme: ${this.#currentTheme.charAt(0).toUpperCase() + this.#currentTheme.slice(1)}`;
        topButtonsContainer.appendChild(this.#createControlButton({
          icon: themeIcon,
          action: () => this.#toggleTheme(),
          label: themeLabel,
        }));
      }

      // Add collapse button
      const collapseBtn = this.#createControlButton({
        icon: icons.collapse,
        action: () => {
          this.#controlsCollapsed = true;
          this.#render();
        },
        label: "Collapse Controls",
      });
      collapseBtn.setAttribute("aria-expanded", "true");
      topButtonsContainer.appendChild(collapseBtn);

      miscGroup.appendChild(topButtonsContainer);

      // Add a spacer to push the bottom buttons down
      const spacer = document.createElement("div");
      spacer.style.flexGrow = "1";
      miscGroup.appendChild(spacer);

      // Download button split control
      const downloadGroup = document.createElement("div");
      downloadGroup.className = "pgv-control-split-button";

      const formatLabels: Record<string, string> = {
        svg: " SVG",
        png: " PNG",
        jpeg: "JPEG",
        json: "JSON"
      };

      const downloadBtn = document.createElement("button");
      downloadBtn.type = "button";
      downloadBtn.className = "pgv-download-action-btn";
      downloadBtn.setAttribute("aria-label", "Download Graph");
      downloadBtn.setAttribute("title", "Download Graph");
      downloadBtn.innerHTML = `
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="${icons.download}"></path>
        </svg>
        <span>${formatLabels[this.#downloadFormat]}</span>
      `;
      downloadBtn.addEventListener("click", () => this.#downloadGraph());
      downloadGroup.appendChild(downloadBtn);

      const dropdownBtn = document.createElement("button");
      dropdownBtn.type = "button";
      dropdownBtn.className = "pgv-download-dropdown-btn";
      dropdownBtn.setAttribute("aria-label", "Select Download Format");
      dropdownBtn.setAttribute("title", "Select Download Format");
      dropdownBtn.setAttribute("aria-haspopup", "menu");
      dropdownBtn.setAttribute("aria-controls", "pgv-download-dropdown-menu");
      dropdownBtn.setAttribute("aria-expanded", this.#downloadDropdownOpen ? "true" : "false");
      dropdownBtn.innerHTML = `
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="${icons.chevronDown}"></path>
        </svg>
      `;
      downloadGroup.appendChild(dropdownBtn);

      const dropdownMenu = document.createElement("div");
      dropdownMenu.className = "pgv-dropdown-menu";
      dropdownMenu.id = "pgv-download-dropdown-menu";
      dropdownMenu.setAttribute("role", "menu");
      if (this.#downloadDropdownOpen) {
        dropdownMenu.classList.add("open");
      }

      const updateFormatLabel = () => {
        const span = downloadBtn.querySelector("span");
        if (span) {
          span.textContent = formatLabels[this.#downloadFormat];
        }
      };

      const formats = ["svg", "png", "jpeg", "json"] as const;
      for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        const option = document.createElement("div");
        option.className = "pgv-dropdown-option";
        option.setAttribute("role", "menuitemradio");
        option.setAttribute("tabindex", "0");
        if (format === this.#downloadFormat) {
          option.classList.add("selected");
          option.setAttribute("aria-checked", "true");
        } else {
          option.setAttribute("aria-checked", "false");
        }
        option.textContent = formatLabels[format];
        option.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            option.click();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = option.nextElementSibling as HTMLElement | null;
            if (next) {
              next.focus();
            } else {
              (dropdownMenu.firstElementChild as HTMLElement)?.focus();
            }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = option.previousElementSibling as HTMLElement | null;
            if (prev) {
              prev.focus();
            } else {
              (dropdownMenu.lastElementChild as HTMLElement)?.focus();
            }
          }
        });
        option.addEventListener("click", () => {
          this.#downloadFormat = format;
          this.#downloadDropdownOpen = false;
          dropdownBtn.setAttribute("aria-expanded", "false");
          dropdownMenu.classList.remove("open");
          updateFormatLabel();
          const opts = dropdownMenu.querySelectorAll(".pgv-dropdown-option");
          for (let i = 0; i < opts.length; i++) {
            const opt = opts[i];
            if (opt.textContent === formatLabels[format]) {
              opt.classList.add("selected");
              opt.setAttribute("aria-checked", "true");
            } else {
              opt.classList.remove("selected");
              opt.setAttribute("aria-checked", "false");
            }
          }
          dropdownBtn.focus();
        });
        dropdownMenu.appendChild(option);
      }
      downloadGroup.appendChild(dropdownMenu);

      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#downloadDropdownOpen = !this.#downloadDropdownOpen;
        dropdownBtn.setAttribute("aria-expanded", this.#downloadDropdownOpen ? "true" : "false");
        if (this.#downloadDropdownOpen) {
          dropdownMenu.classList.add("open");
          const firstOption = dropdownMenu.querySelector('.pgv-dropdown-option') as HTMLElement;
          if (firstOption) {
            firstOption.focus();
          }
        } else {
          dropdownMenu.classList.remove("open");
        }
      });

      dropdownMenu.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.#downloadDropdownOpen = false;
          dropdownBtn.setAttribute("aria-expanded", "false");
          dropdownMenu.classList.remove("open");
          dropdownBtn.focus();
        }
      });

      // Close dropdown when clicking outside
      this.#downloadAbortController?.abort();
      this.#downloadAbortController = new AbortController();
      document.addEventListener("click", () => {
        if (this.#downloadDropdownOpen) {
          this.#downloadDropdownOpen = false;
          dropdownBtn.setAttribute("aria-expanded", "false");
          dropdownMenu.classList.remove("open");
        }
      }, { signal: this.#downloadAbortController.signal });

      miscGroup.appendChild(downloadGroup);

      buttonsContainer.appendChild(miscGroup);

    // Add minimap container if pan/zoom is enabled
    if (this.#options.usePanZoom) {
      const minimap = document.createElement("div");
      minimap.className = `pgv-minimap ${this.#minimapOpen ? "pgv-minimap-open" : ""}`;

      const canvas = document.createElement("canvas");
      canvas.className = "pgv-minimap-canvas";
      // Prevent intrinsic canvas size (300x150) from forcing a wider container on first tick
      canvas.width = 0;
      canvas.height = 0;
      minimap.appendChild(canvas);

      const viewportBox = document.createElement("div");
      viewportBox.className = "pgv-minimap-viewport";
      minimap.appendChild(viewportBox);

      controls.appendChild(minimap);

      if (this.#minimapOpen) {
        requestAnimationFrame(() => {
          this.#setupMinimap(minimap, canvas, viewportBox);
        });
      }
    }

    controls.appendChild(this.#renderHistoryPanel());
    controls.appendChild(buttonsContainer);

    return controls;
  }

  #createControlButton(btn: { icon: string, action: () => void, label: string }): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", btn.label);
    button.setAttribute("title", btn.label);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", btn.icon);
    svg.appendChild(path);
    button.appendChild(svg);

    button.addEventListener("click", (e) => {
      if (button.getAttribute("aria-disabled") === "true") return;
      e.preventDefault();
      e.stopPropagation();
      btn.action();
    });
    return button;
  }

  #zoom(delta: number, cx?: number, cy?: number): void {
    const viewport = this.container.querySelector<HTMLElement>(`.${PGV_VIEWPORT_CLASS}`);
    if (!this.#layout || !viewport) {
      this.#viewportState.scale = Math.max(0.1, this.#viewportState.scale + delta);
      this.#applyViewport();
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const zoomCenterX = cx ?? (rect.width / 2);
    const zoomCenterY = cy ?? (rect.height / 2);

    const oldScale = this.#viewportState.scale;
    const newScale = Math.max(0.1, oldScale + delta);

    const logicalX = (zoomCenterX - this.#viewportState.x) / oldScale;
    const logicalY = (zoomCenterY - this.#viewportState.y) / oldScale;

    const clampedLogicalX = Math.max(0, Math.min(logicalX, this.#layout.width));
    const clampedLogicalY = Math.max(0, Math.min(logicalY, this.#layout.height));

    const physicalX = clampedLogicalX * oldScale + this.#viewportState.x;
    const physicalY = clampedLogicalY * oldScale + this.#viewportState.y;

    this.#viewportState.scale = newScale;
    this.#viewportState.x = physicalX - clampedLogicalX * newScale;
    this.#viewportState.y = physicalY - clampedLogicalY * newScale;

    this.#applyViewport();
  }

  #pan(dx: number, dy: number): void {
    this.#viewportState.x += dx;
    this.#viewportState.y += dy;
    this.#applyViewport();
  }

  #reset(): void {
    const viewport = this.container.querySelector<HTMLElement>(`.${PGV_VIEWPORT_CLASS}`);
    if (!this.#layout || !viewport) {
      this.#viewportState = { x: 0, y: 0, scale: 1 };
      this.#applyViewport();
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const padding = 40;

    const availWidth = Math.max(1, rect.width - padding * 2);
    const availHeight = Math.max(1, rect.height - padding * 2);

    const layoutWidth = Math.max(1, this.#layout.width);
    const layoutHeight = Math.max(1, this.#layout.height);

    let scale = Math.min(availWidth / layoutWidth, availHeight / layoutHeight);

    // Cap max scale to 1 to avoid over-zooming tiny graphs
    if (scale > 1) {
      scale = 1;
    }

    const cx = (rect.width - layoutWidth * scale) / 2;
    const cy = (rect.height - layoutHeight * scale) / 2;

    this.#viewportState = { x: cx, y: cy, scale };
    this.#applyViewport();
  }

  #toggleMinimap(): void {
    this.#minimapOpen = !this.#minimapOpen;
    this.#render();
  }

  #toggleTheme(): void {
    const themes: Array<"light" | "dark" | "auto"> = ["light", "dark", "auto"];
    const currentIndex = themes.indexOf(this.#currentTheme);
    this.#currentTheme = themes[(currentIndex + 1) % themes.length];
    this.#options.onThemeChange?.(this.#currentTheme);
    this.#render();
  }

  #applyViewport(): void {
    const stage = this.container.querySelector<HTMLElement>(".pgv-graph-stage");
    if (stage) {
      stage.style.transform = `translate(${this.#viewportState.x}px, ${this.#viewportState.y}px) scale(${this.#viewportState.scale})`;
    }
    this.#updateMinimapViewport();
  }

  #setupMinimap(minimap: HTMLElement, canvas: HTMLCanvasElement, viewportBox: HTMLElement): void {
    this.#minimapResizeObserver?.disconnect();
    this.#minimapAbortController?.abort();
    this.#minimapAbortController = new AbortController();

    this.#minimapResizeObserver = new ResizeObserver(() => {
      this.#drawMinimap(canvas);
      this.#updateMinimapViewport();
    });

    this.#minimapResizeObserver.observe(minimap);
    this.#minimapResizeObserver.observe(this.container);

    this.#drawMinimap(canvas);
    this.#updateMinimapViewport();

    // Interaction events
    let isDraggingMinimap = false;

    const mapToViewport = (clientX: number, clientY: number) => {
      if (!this.#layout) return;
      const rect = minimap.getBoundingClientRect();
      const padding = 10;
      const availWidth = rect.width - padding * 2;
      const availHeight = rect.height - padding * 2;

      const mapScale = Math.min(availWidth / this.#layout.width, availHeight / this.#layout.height);
      const offsetX = padding + (availWidth - this.#layout.width * mapScale) / 2;
      const offsetY = padding + (availHeight - this.#layout.height * mapScale) / 2;

      // Click position relative to the minimap layout area
      const clickX = clientX - rect.left - offsetX;
      const clickY = clientY - rect.top - offsetY;

      // Map back to logical coordinates
      const logicalX = clickX / mapScale;
      const logicalY = clickY / mapScale;

      const containerRect = this.container.getBoundingClientRect();
      const viewWidth = containerRect.width / this.#viewportState.scale;
      const viewHeight = containerRect.height / this.#viewportState.scale;

      this.#viewportState.x = -(logicalX - viewWidth / 2) * this.#viewportState.scale;
      this.#viewportState.y = -(logicalY - viewHeight / 2) * this.#viewportState.scale;

      this.#applyViewport();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDraggingMinimap = true;
      minimap.setPointerCapture(e.pointerId);
      mapToViewport(e.clientX, e.clientY);
      e.stopPropagation(); // prevent pan Zoom events
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingMinimap) return;
      mapToViewport(e.clientX, e.clientY);
      e.stopPropagation();
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingMinimap = false;
      minimap.releasePointerCapture(e.pointerId);
    };

    minimap.addEventListener("pointerdown", handlePointerDown, { signal: this.#minimapAbortController.signal });
    // Using pointermove/pointerup on the minimap, and relying on setPointerCapture to keep tracking
    minimap.addEventListener("pointermove", handlePointerMove, { signal: this.#minimapAbortController.signal });
    minimap.addEventListener("pointerup", handlePointerUp, { signal: this.#minimapAbortController.signal });
    minimap.addEventListener("pointercancel", handlePointerUp, { signal: this.#minimapAbortController.signal });
  }

  #drawMinimap(canvas: HTMLCanvasElement): void {
    if (!this.#graph || !this.#layout) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layout = this.#layout;
    // Add some padding
    const padding = 10;
    const availWidth = canvas.width - padding * 2;
    const availHeight = canvas.height - padding * 2;

    if (layout.width === 0 || layout.height === 0 || availWidth <= 0 || availHeight <= 0) return;

    const scale = Math.min(availWidth / layout.width, availHeight / layout.height);

    const offsetX = padding + (availWidth - layout.width * scale) / 2;
    const offsetY = padding + (availHeight - layout.height * scale) / 2;

    // Get CSS variables for colors
    const computedStyle = getComputedStyle(this.container);
    const nodeColor = computedStyle.getPropertyValue("--pgv-minimap-node-color").trim() || "rgba(105, 117, 134, 0.6)";
    const edgeColor = computedStyle.getPropertyValue("--pgv-minimap-edge-color").trim() || "rgba(105, 117, 134, 0.4)";
    const selectedColor = computedStyle.getPropertyValue("--pgv-minimap-selected-color").trim() || "#d97706";
    // Draw edges
    ctx.lineWidth = 1;
    for (const edge of this.#graph.edges.values()) {
      const endpoints = edgeEndpoints(edge, layout);
      if (!endpoints) continue;

      ctx.strokeStyle = this.#options.selection?.edges.has(edge.id) ? selectedColor : edgeColor;
      ctx.beginPath();

      const pathPts = endpoints.path;
      if (pathPts.length > 0) {
        ctx.moveTo(offsetX + pathPts[0].x * scale, offsetY + pathPts[0].y * scale);
        for (let i = 1; i < pathPts.length; i++) {
          ctx.lineTo(offsetX + pathPts[i].x * scale, offsetY + pathPts[i].y * scale);
        }
      }

      ctx.stroke();
    }

    // Draw nodes
    for (const node of this.#graph.nodes.values()) {
      const position = layout.positions.get(node.id);
      if (!position) continue;

      const nodeSize = layout.nodeSizes?.get(node.id) || layout.nodeSize;
      const nw = nodeSize.width * scale;
      const nh = nodeSize.height * scale;

      const nx = offsetX + position.x * scale;
      const ny = offsetY + position.y * scale;

      ctx.fillStyle = this.#options.selection?.nodes.has(node.id) ? selectedColor : nodeColor;
      ctx.fillRect(nx, ny, nw, nh);
    }
  }

  async #downloadGraph(): Promise<void> {
    const stage = this.container.querySelector<HTMLElement>(".pgv-graph-stage");
    if (!stage || !this.#layout || !this.#graph) return;

    const downloadBtn = this.container.querySelector<HTMLButtonElement>(".pgv-download-action-btn");
    const dropdownBtn = this.container.querySelector<HTMLButtonElement>(".pgv-download-dropdown-btn");
    let originalBtnHtml = "";
    let originalDownloadTitle = "";
    let originalDropdownTitle = "";

    if (downloadBtn && dropdownBtn) {
      originalBtnHtml = downloadBtn.innerHTML;
      originalDownloadTitle = downloadBtn.title;
      originalDropdownTitle = dropdownBtn.title;

      downloadBtn.setAttribute("aria-disabled", "true");
      dropdownBtn.setAttribute("aria-disabled", "true");

      downloadBtn.title = "Downloading graph...";
      downloadBtn.setAttribute("aria-label", downloadBtn.title);
      dropdownBtn.title = "Download in progress";
      dropdownBtn.setAttribute("aria-label", dropdownBtn.title);

      const formatLabels: Record<string, string> = { svg: " SVG", png: " PNG", jpeg: "JPEG", json: "JSON" };
      downloadBtn.innerHTML = `
        <svg class="pgv-spinner" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <span>${formatLabels[this.#downloadFormat]}</span>
      `;

      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    try {
      if (this.#downloadFormat === "json") {
      const json: any = graphSnapshotToJson(this.#graph);

      if (this.#options.selection) {
        json.selection = {
          nodes: Array.from(this.#options.selection.nodes),
          edges: Array.from(this.#options.selection.edges)
        };
      }

      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `graph-${timestamp}.json`;
      link.href = dataUrl;
      link.click();
      URL.revokeObjectURL(dataUrl);
      return;
    }

    // We want to download the entire graph, ignoring current viewport transform
    const width = this.#layout.width;
    const height = this.#layout.height;

    // Get the computed styles to extract the CSS variables applied by the theme
    // We must pass these down because html-to-image clones the stage element
    // without its parent container, losing the theme variables.
    const containerStyle = window.getComputedStyle(this.container);
    const themeVariables: Record<string, string> = {};
    for (let i = 0; i < containerStyle.length; i++) {
      const prop = containerStyle[i];
      if (prop.startsWith("--pgv-")) {
        themeVariables[prop] = containerStyle.getPropertyValue(prop);
      }
    }

    const options = {
      width,
      height,
      backgroundColor: themeVariables["--pgv-color-bg"] || "transparent",
      style: {
        ...themeVariables,
        transform: "none", // Override the translate/scale for pan and zoom
        transformOrigin: "top left",
      },
      filter: (node: HTMLElement) => {
        // Exclude the controls from the image if we ever capture the container directly
        if (node.classList?.contains("pgv-controls") || node.classList?.contains("pgv-history-panel")) {
          return false;
        }
        return true;
      }
    };

    // html-to-image has issues copying CSS variables down into nested contexts properly during cloning.
    // To ensure elements (edges, compound nodes, SVG text) render correctly, we temporarily inline
    // the computed critical properties before exporting, and then remove them afterward.

    const edgeColor = themeVariables["--pgv-edge-color"] || "#697586";
    const selectedColor = themeVariables["--pgv-selected-color"] || "#2563eb";
    const labelFg = themeVariables["--pgv-edge-label-fg"] || "#445160";
    const labelBg = themeVariables["--pgv-edge-label-bg"] || "#f9fbfd";

    const originalStyles = new Map<Element, string | null>();

    const applyInlineStyle = (el: Element, styleStr: string) => {
      originalStyles.set(el, el.getAttribute("style"));
      el.setAttribute("style", (el.getAttribute("style") || "") + ";" + styleStr);
    };

    // Query only the specific functional layers to avoid massive getComputedStyle overhead on arbitrary children.
    const allElements = stage.querySelectorAll<HTMLElement | SVGElement>(".pgv-graph-node, .pgv-compound-node, .pgv-compound-node-header, .pgv-graph-edge > path, .pgv-graph-edge marker path, .pgv-edge-label");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const isPath = el.tagName.toLowerCase() === "path";
      const isText = el.tagName.toLowerCase() === "text";
      const isGraphNode = el.classList.contains("pgv-graph-node") || el.classList.contains("pgv-compound-node") || el.classList.contains("pgv-compound-node-header");

      const isSelected = el.closest(".pgv-selected") !== null;

      const computed = window.getComputedStyle(el);

      let inline = "";

      // For standard HTML nodes (like compound nodes and node boundaries)
      if (isGraphNode && el instanceof HTMLElement) {
        const bg = computed.getPropertyValue("background-color");
        const shadow = computed.getPropertyValue("box-shadow");
        const border = computed.getPropertyValue("border");
        const borderTop = computed.getPropertyValue("border-top");
        const borderRight = computed.getPropertyValue("border-right");
        const borderBottom = computed.getPropertyValue("border-bottom");
        const borderLeft = computed.getPropertyValue("border-left");
        const borderRadius = computed.getPropertyValue("border-radius");
        const color = computed.getPropertyValue("color");

        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") inline += `background-color: ${bg};`;
        if (shadow && shadow !== "none") inline += `box-shadow: ${shadow};`;
        if (border && border !== "none" && border !== "") inline += `border: ${border};`;
        if (borderTop && borderTop !== "none" && borderTop !== "") inline += `border-top: ${borderTop};`;
        if (borderRight && borderRight !== "none" && borderRight !== "") inline += `border-right: ${borderRight};`;
        if (borderBottom && borderBottom !== "none" && borderBottom !== "") inline += `border-bottom: ${borderBottom};`;
        if (borderLeft && borderLeft !== "none" && borderLeft !== "") inline += `border-left: ${borderLeft};`;
        if (borderRadius && borderRadius !== "0px") inline += `border-radius: ${borderRadius};`;
        if (color && color !== "") inline += `color: ${color};`;
      }

      // For SVG elements inside edges
      if (el instanceof SVGElement) {
        const inEdgeLayer = el.closest(".pgv-edge-layer") !== null;
        if (inEdgeLayer && isPath) {
          const isMarker = el.closest("marker") !== null;

          if (!isMarker) {
            // It's a main edge path
            const computedStroke = computed.getPropertyValue("stroke");
            const computedStrokeWidth = computed.getPropertyValue("stroke-width");
            const computedStrokeLinecap = computed.getPropertyValue("stroke-linecap");

            const finalStroke = isSelected ? selectedColor : (computedStroke !== "none" && computedStroke ? computedStroke : edgeColor);
            const finalStrokeWidth = isSelected ? "3px" : (computedStrokeWidth || "2px");

            inline += `fill: transparent; stroke: ${finalStroke}; stroke-linecap: ${computedStrokeLinecap || "round"}; stroke-width: ${finalStrokeWidth};`;
          } else {
            // It's an arrowhead marker path
            const edgeGroup = el.closest(".pgv-graph-edge");
            const mainPath = edgeGroup?.querySelector(":scope > path");
            const computedFill = mainPath ? window.getComputedStyle(mainPath).getPropertyValue("stroke") : computed.getPropertyValue("fill");

            const finalFill = isSelected ? selectedColor : (computedFill !== "none" && computedFill ? computedFill : edgeColor);

            inline += `fill: ${finalFill}; stroke: none;`;
          }
        }

        if (inEdgeLayer && isText) {
          const computedFill = computed.getPropertyValue("fill");
          const computedStroke = computed.getPropertyValue("stroke");

          const finalFill = computedFill !== "none" && computedFill ? computedFill : labelFg;
          const finalStroke = computedStroke !== "none" && computedStroke ? computedStroke : labelBg;

          inline += `fill: ${finalFill}; stroke: ${finalStroke}; paint-order: stroke; stroke-width: 4px; font-size: 12px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-anchor: middle; stroke-linejoin: round; pointer-events: none;`;
        }
      }

      if (inline) {
        applyInlineStyle(el, inline);
      }
    }

    try {
      let dataUrl: string;
      switch (this.#downloadFormat) {
        case "png":
          dataUrl = await toPng(stage, options);
          break;
        case "jpeg":
          dataUrl = await toJpeg(stage, options);
          break;
        case "svg":
        default:
          dataUrl = await toSvg(stage, options);
          break;
      }

      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `graph-${timestamp}.${this.#downloadFormat === "jpeg" ? "jpg" : this.#downloadFormat}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download graph image:", error);
    } finally {
      // Restore original styles
      if (typeof originalStyles !== 'undefined' && originalStyles) {
        for (const [el, style] of originalStyles) {
          if (style === null) {
            el.removeAttribute("style");
          } else {
            el.setAttribute("style", style);
          }
        }
      }
    }
    } finally {
      if (downloadBtn && dropdownBtn) {
        downloadBtn.innerHTML = originalBtnHtml;
        downloadBtn.setAttribute("aria-disabled", "false");
        dropdownBtn.setAttribute("aria-disabled", "false");
        downloadBtn.title = originalDownloadTitle;
        downloadBtn.setAttribute("aria-label", originalDownloadTitle);
        dropdownBtn.title = originalDropdownTitle;
        dropdownBtn.setAttribute("aria-label", originalDropdownTitle);
      }
    }
  }

  #updateMinimapViewport(): void {
    if (!this.#minimapOpen || !this.#layout) return;

    const minimap = this.container.querySelector<HTMLElement>(".pgv-minimap");
    const viewportBox = this.container.querySelector<HTMLElement>(".pgv-minimap-viewport");

    if (!minimap || !viewportBox) return;

    const layout = this.#layout;
    const rect = minimap.getBoundingClientRect();
    const padding = 10;
    const availWidth = rect.width - padding * 2;
    const availHeight = rect.height - padding * 2;

    if (layout.width === 0 || layout.height === 0 || availWidth <= 0 || availHeight <= 0) return;

    const mapScale = Math.min(availWidth / layout.width, availHeight / layout.height);
    const offsetX = padding + (availWidth - layout.width * mapScale) / 2;
    const offsetY = padding + (availHeight - layout.height * mapScale) / 2;

    const containerRect = this.container.getBoundingClientRect();

    // Calculate the visible area in logical layout coordinates
    const viewWidth = containerRect.width / this.#viewportState.scale;
    const viewHeight = containerRect.height / this.#viewportState.scale;

    const viewX = -this.#viewportState.x / this.#viewportState.scale;
    const viewY = -this.#viewportState.y / this.#viewportState.scale;

    // Map to minimap coordinates
    const boxX = offsetX + viewX * mapScale;
    const boxY = offsetY + viewY * mapScale;
    const boxWidth = viewWidth * mapScale;
    const boxHeight = viewHeight * mapScale;

    viewportBox.style.left = `${boxX}px`;
    viewportBox.style.top = `${boxY}px`;
    viewportBox.style.width = `${boxWidth}px`;
    viewportBox.style.height = `${boxHeight}px`;
  }

  #setupPanZoomEvents(viewport: HTMLElement, signal: AbortSignal): void {
    const activePointers = new Map<number, PointerEvent>();
    let lastPanDistance = 0;
    let startX = 0;
    let startY = 0;

    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      if (activePointers.size === 0) {
        this.#isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
      }

      activePointers.set(e.pointerId, e);

      if (activePointers.size === 2) {
        viewport.setPointerCapture(e.pointerId);
        const iter = activePointers.values();
        const p1 = iter.next().value!;
        const p2 = iter.next().value!;
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        lastPanDistance = Math.hypot(dx, dy);
      }
    }, { signal });

    viewport.addEventListener("pointermove", (e) => {
      if (!activePointers.has(e.pointerId)) return;

      const lastPointer = activePointers.get(e.pointerId)!;
      activePointers.set(e.pointerId, e);

      if (activePointers.size === 1) {
        if (!this.#isDragging && Math.hypot(e.clientX - startX, e.clientY - startY) > 5) {
          this.#isDragging = true;
          viewport.setPointerCapture(e.pointerId);
        }
        if (this.#isDragging) {
          const dx = e.clientX - lastPointer.clientX;
          const dy = e.clientY - lastPointer.clientY;
          this.#pan(dx, dy);
        }
      } else if (activePointers.size === 2) {
        this.#isDragging = true;
        const iter = activePointers.values();
        const p1 = iter.next().value!;
        const p2 = iter.next().value!;
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        const distance = Math.hypot(dx, dy);

        // Calculate a reasonable delta for zooming based on pinch distance
        if (lastPanDistance > 0) {
           const zoomSpeed = 0.005; // adjust for sensitivity
           const delta = (distance - lastPanDistance) * zoomSpeed;
           const rect = viewport.getBoundingClientRect();
           const cx = (p1.clientX + p2.clientX) / 2 - rect.left;
           const cy = (p1.clientY + p2.clientY) / 2 - rect.top;
           this.#zoom(delta, cx, cy);
        }
        lastPanDistance = distance;
      }
    }, { signal });

    const handlePointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);

      if (activePointers.size < 2) {
        lastPanDistance = 0;
      }

      // JSDOM does not implement hasPointerCapture, so we just wrap in try/catch or check if present
      if (typeof viewport.hasPointerCapture === 'function') {
        if (viewport.hasPointerCapture(e.pointerId)) {
          viewport.releasePointerCapture(e.pointerId);
        }
      } else {
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch (err) {
          // Ignore
        }
      }
    };

    viewport.addEventListener("pointerup", handlePointerUp, { signal });
    viewport.addEventListener("pointercancel", handlePointerUp, { signal });

    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const rect = viewport.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      this.#zoom(delta, cx, cy);
    }, { passive: false, signal });
  }

  #setupEvents(element: HTMLElement): void {
    const handleInteraction = (target: HTMLElement, event: Event) => {
      const nodeElement = target.closest<HTMLElement>(".pgv-graph-node");
      if (nodeElement && nodeElement.dataset.nodeId) {
        this.#options.onNodeClick?.(nodeElement.dataset.nodeId, event);
        return;
      }

      const edgeElement = target.closest<HTMLElement>(".pgv-graph-edge");
      if (edgeElement && edgeElement.dataset.edgeId) {
        this.#options.onEdgeClick?.(edgeElement.dataset.edgeId, event);
        return;
      }
    };

    element.addEventListener("click", (event) => {
      if (this.#isDragging) {
        return;
      }
      handleInteraction(event.target as HTMLElement, event);
    });

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const target = event.target as HTMLElement;
        const isGraphElement = target.closest(".pgv-graph-node") || target.closest(".pgv-graph-edge");

        if (isGraphElement) {
          event.preventDefault();
          handleInteraction(target, event);
        }
      }
    });

    element.addEventListener("focus", (event) => {
      const target = event.target as HTMLElement;

      // Try to determine if focus was caused by a mouse click vs keyboard tab
      // The browser outline will only be drawn when :focus-visible is active
      // In JS we can check if it matches that pseudo-class in modern browsers
      let isKeyboardFocus = true;
      try {
        isKeyboardFocus = target.matches(":focus-visible");
      } catch (e) {
        // Fallback for older browsers
      }

      if (isKeyboardFocus) {
        if (target.classList.contains("pgv-graph-node") && target.dataset.nodeId) {
          this.#centerOnGraphElement("node", target.dataset.nodeId);
        } else if (target.classList.contains("pgv-graph-edge") && target.dataset.edgeId) {
          this.#centerOnGraphElement("edge", target.dataset.edgeId);
        }
      }
    }, true);
  }
}

// Cache computed class names for graph tags to avoid redundant string allocations
// and regex evaluations during render loops.
const tagCache = new Map<string, string>();

/**
 * Converts a raw semantic tag string into a safe, normalized CSS class name.
 * Results are memoized for rendering performance.
 *
 * @param tag The semantic tag to normalize.
 * @returns A CSS-safe class name (e.g. `tag-entry`).
 */
export function tagToClassName(tag: string): string {
  let result = tagCache.get(tag);
  if (result !== undefined) {
    return result;
  }

  const normalized = tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  result = `tag-${normalized || "untagged"}`;

  if (tagCache.size > 10000) {
    tagCache.clear();
  }
  tagCache.set(tag, result);

  return result;
}

function renderEdges(
  graph: GraphSnapshot,
  layout: LayoutSnapshot,
  options: GraphViewOptions,
  schema: GraphSchema,
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const edgeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

  svg.classList.add("pgv-edge-layer");
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("width", `${layout.width}`);
  svg.setAttribute("height", `${layout.height}`);
  svg.setAttribute("aria-hidden", "true");

  edgeLayer.classList.add("pgv-edge-layer-inner");
  svg.appendChild(edgeLayer);

  const containmentSet = schema.containment ? new Set(schema.containment) : null;

  for (const edge of graph.edges.values()) {
    let isContainment = false;
    if (containmentSet && edge.tags.length > 0) {
      for (let i = 0; i < edge.tags.length; i++) {
        if (containmentSet.has(edge.tags[i])) {
          isContainment = true;
          break;
        }
      }
    }
    if (isContainment) {
      continue;
    }

    const endpoints = edgeEndpoints(edge, layout);

    if (!endpoints) {
      continue;
    }

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // Optimized string builder: avoids array allocations and .map() inside the hot loop.
    let className = "graph-edge pgv-graph-edge";
    for (let i = 0; i < edge.tags.length; i++) {
      className += " " + tagToClassName(edge.tags[i]);
    }

    if (options.selection?.edges.has(edge.id)) {
      className += " pgv-selected";
    }

    const pathPts = endpoints.path;
    let pathData = `M ${pathPts[0].x} ${pathPts[0].y}`;
    for (let i = 1; i < pathPts.length; i++) {
      pathData += ` L ${pathPts[i].x} ${pathPts[i].y}`;
    }

    group.setAttribute("class", className);
    group.dataset.edgeId = edge.id;
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");

    const markerId = `pgv-arrowhead-${markerIdSequence++}`;
    group.appendChild(createArrowMarker(markerId));

    let edgeAriaLabel = `Edge ${edge.id}`;
    const label = options.edgeLabel?.(edge) ?? null;
    if (label) {
      edgeAriaLabel += `: ${label}`;
    }
    group.setAttribute("aria-label", edgeAriaLabel);

    path.setAttribute("d", pathData);
    path.setAttribute("marker-end", `url(#${markerId})`);

    let totalLength = 0;
    const lengths: number[] = [];
    for (let i = 1; i < pathPts.length; i++) {
      const len = Math.abs(pathPts[i].x - pathPts[i-1].x) + Math.abs(pathPts[i].y - pathPts[i-1].y);
      lengths.push(len);
      totalLength += len;
    }

    // Trim the visible line slightly before the marker tip so it doesn't bleed through
    const trimAmount = 5;
    path.setAttribute("stroke-dasharray", `${Math.max(0, totalLength - trimAmount)} ${totalLength + trimAmount}`);

    group.appendChild(path);

    if (label) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      // Find middle of the path to place the label
      const halfLen = totalLength / 2;
      let currLen = 0;
      let midX = 0;
      let midY = 0;

      for (let i = 0; i < lengths.length; i++) {
        if (currLen + lengths[i] >= halfLen) {
           const remainder = halfLen - currLen;
           const ratio = lengths[i] === 0 ? 0 : remainder / lengths[i];
           midX = pathPts[i].x + (pathPts[i+1].x - pathPts[i].x) * ratio;
           midY = pathPts[i].y + (pathPts[i+1].y - pathPts[i].y) * ratio;
           break;
        }
        currLen += lengths[i];
      }

      text.classList.add("pgv-edge-label");
      text.setAttribute("x", `${midX}`);
      text.setAttribute("y", `${midY - 8}`);
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
    element.style.width = `${nodeSize.width}px`;

    // Always explicitly apply calculated height to ensure visually consistent boundary with mathematical layout
    element.style.height = `${nodeSize.height}px`;

    const parentId = layout.hierarchy?.get(node.id)?.parent;
    if (parentId && layout.positions.has(parentId)) {
      const parentPos = layout.positions.get(parentId)!;
      element.style.transform = `translate(${position.x - parentPos.x}px, ${position.y - parentPos.y}px)`;
    } else {
      element.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }

    if (isCompound) {
       const header = document.createElement("div");
       header.className = "pgv-compound-node-header";

       const title = document.createElement("div");
       title.className = "pgv-node-title";
       title.textContent = typeof node.attributes["XCSG.name"] === "string" ? node.attributes["XCSG.name"] : node.id;

       const toggleBtn = document.createElement("button");
       toggleBtn.className = "pgv-node-collapse-toggle";
       toggleBtn.title = `Collapse node ${node.id} (Disabled)`;
       toggleBtn.setAttribute("aria-label", `Collapse node ${node.id} (Disabled)`);
       toggleBtn.setAttribute("aria-expanded", "true");
       toggleBtn.setAttribute("aria-disabled", "true");
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
      title.textContent = typeof node.attributes["XCSG.name"] === "string" ? node.attributes["XCSG.name"] : node.id;

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "pgv-node-collapse-toggle";
      toggleBtn.title = `Expand node ${node.id}`;
      toggleBtn.setAttribute("aria-label", `Expand node ${node.id}`);
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
        toggleBtn.title = `Collapse node ${node.id}`;
        toggleBtn.setAttribute("aria-label", `Collapse node ${node.id}`);
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
    // A node is a root element if it has no parent, OR if its parent is not present in the positions (e.g. invalid hierarchy)
    if (!parentId || !layout.positions.has(parentId)) {
      const el = renderSingleNode(nodeId);
      if (el) {
        nodes.push(el);
      }
    }
  }

  return nodes;
}


function defaultNodeContent(node: GraphNode): HTMLElement {
  const content = document.createElement("div");
  const title = document.createElement("div");
  const id = document.createElement("div");

  const attributes: [string, AttributeValue][] = [];
  for (const key in node.attributes) {
    if (Object.prototype.hasOwnProperty.call(node.attributes, key)) {
      attributes.push([key, node.attributes[key]]);
    }
  }

  content.className = "pgv-node-content";
  title.className = "pgv-node-title";
  title.textContent = typeof node.attributes["XCSG.name"] === "string" ? node.attributes["XCSG.name"] : node.id;
  id.className = "pgv-node-id";
  id.textContent = node.id;

  content.append(title, id);

  if (attributes.length > 0) {
    const list = document.createElement("dl");

    list.className = "pgv-node-attributes";

    for (const [key, value] of attributes) {
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

function createArrowMarker(markerId: string): SVGDefsElement {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("orient", "auto-start-reverse");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  marker.appendChild(path);
  defs.appendChild(marker);

  return defs;
}

function attributeToText(value: AttributeValue): string {
  if (typeof value === "object" && value !== null) {
    if ("integer" in value) return String(value.integer);
    if ("float" in value) return String(value.float);
    if ("bytes" in value) return `[bytes: ${value.bytes}]`;
  }
  return String(value);
}

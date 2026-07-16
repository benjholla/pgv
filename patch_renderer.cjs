const fs = require('fs');
let code = fs.readFileSync('src/renderer.ts', 'utf8');

// 1. Refactor empty query check in #executeSearch()
const executeSearchCheck = `  #executeSearch(): void {
    if (!this.#graph) return;

    const isAttributeMode = ATTRIBUTE_SEARCH_MODES.has(this.#searchMode);

    // If not attribute mode and query is empty, or attribute mode and BOTH are empty, clear
    if (!isAttributeMode && !this.#searchQuery) {
      this.#searchResults = [];
      this.#searchCycleIndex = -1;
      this.#options.onSelectionChange?.({ nodes: new Set(), edges: new Set() });
      this.#render();
      this.#updateSearchUI?.();
      return;
    }
    if (isAttributeMode && !this.#searchKeyQuery && !this.#searchQuery) {
      this.#searchResults = [];
      this.#searchCycleIndex = -1;
      this.#options.onSelectionChange?.({ nodes: new Set(), edges: new Set() });
      this.#render();
      this.#updateSearchUI?.();
      return;
    }`;

const executeSearchCheckNew = `  #executeSearch(): void {
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
    }`;
code = code.replace(executeSearchCheck, executeSearchCheckNew);

// 2. Extract #traverseSearchResults
const getPreviewCount = `  #getPreviewCount(): number {
    if (!this.#graph) return 0;

    const isAttributeMode = ATTRIBUTE_SEARCH_MODES.has(this.#searchMode);
    if (!isAttributeMode && !this.#searchQuery) return 0;
    if (isAttributeMode && !this.#searchKeyQuery && !this.#searchQuery) return 0;

    const valueMatcher = this.#compileMatcher(this.#searchQuery, this.#searchExactValue, this.#searchCaseSensitiveValue, this.#searchRegexValue);
    const keyMatcher = this.#compileMatcher(this.#searchKeyQuery, this.#searchExactKey, this.#searchCaseSensitiveKey, this.#searchRegexKey);

    let count = 0;
    const searchNodes = NODE_SEARCH_MODES.has(this.#searchMode);
    const searchEdges = EDGE_SEARCH_MODES.has(this.#searchMode);

    if (searchNodes) {
      for (const node of this.#graph.nodes.values()) {
        if (this.#matchElement(node, this.#searchMode, "node", valueMatcher, keyMatcher)) count++;
      }
    }

    if (searchEdges) {
      for (const edge of this.#graph.edges.values()) {
        if (this.#matchElement(edge, this.#searchMode, "edge", valueMatcher, keyMatcher)) count++;
      }
    }

    return count;
  }`;

const getPreviewCountNew = `  #traverseSearchResults(
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
  }`;

code = code.replace(getPreviewCount, getPreviewCountNew);


const executeSearchBody = `    const matchedNodes = new Set<string>();
    const matchedEdges = new Set<string>();
    this.#searchResults = [];

    const searchNodes = NODE_SEARCH_MODES.has(this.#searchMode);
    const searchEdges = EDGE_SEARCH_MODES.has(this.#searchMode);

    if (searchNodes) {
      for (const node of this.#graph.nodes.values()) {
        if (this.#matchElement(node, this.#searchMode, "node", valueMatcher, keyMatcher)) {
          matchedNodes.add(node.id);
          this.#searchResults.push({ type: "node", id: node.id });
        }
      }
    }

    if (searchEdges) {
      for (const edge of this.#graph.edges.values()) {
        if (this.#matchElement(edge, this.#searchMode, "edge", valueMatcher, keyMatcher)) {
          matchedEdges.add(edge.id);
          this.#searchResults.push({ type: "edge", id: edge.id });
        }
      }
    }`;

const executeSearchBodyNew = `    const matchedNodes = new Set<string>();
    const matchedEdges = new Set<string>();
    this.#searchResults = [];

    this.#traverseSearchResults(valueMatcher, keyMatcher, (type, id) => {
      if (type === "node") matchedNodes.add(id);
      else matchedEdges.add(id);
      this.#searchResults.push({ type, id });
    });`;

code = code.replace(executeSearchBody, executeSearchBodyNew);


fs.writeFileSync('src/renderer.ts', code);

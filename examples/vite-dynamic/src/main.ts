import {
  graphSnapshotFromJson,
  renderGraph,
  verticalLayout,
  type GraphSnapshot,
  type GraphSnapshotJson,
  type SelectionState,
} from "../../../src";
import "../../../src/style.css";
import "./demo.css";

const graphElement = requireElement("#graph");
const summaryElement = requireElement("#graph-summary");

let currentGraph: GraphSnapshot | null = null;
let currentLayout: any = null;
let currentSelection: SelectionState = {
  nodes: new Set(),
  edges: new Set(),
};
let graphView: any = null;

function requireElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Demo shell is missing "${selector}".`);
  }

  return element;
}

async function loadGraph(): Promise<void> {
  const response = await fetch("http://localhost:8080/api/graphs/cfg-main");

  if (!response.ok) {
    throw new Error(`Unable to load graph JSON: ${response.status}`);
  }

  const json = (await response.json()) as GraphSnapshotJson;
  currentGraph = graphSnapshotFromJson(json);
  currentLayout = verticalLayout(currentGraph, {
    nodeWidth: 240,
    nodeHeight: 94,
    layerSpacing: 152,
    nodeSpacing: 290,
    margin: 36,
  });

  updateGraph();
}

function updateGraph(): void {
  if (!currentGraph) return;

  const options = {
    layout: currentLayout,
    selection: currentSelection,
    usePanZoom: true,
    onNodeClick: (nodeId: string) => {
      const nodes = new Set(currentSelection.nodes);
      if (nodes.has(nodeId)) {
        nodes.delete(nodeId);
      } else {
        nodes.add(nodeId);
      }
      currentSelection = { ...currentSelection, nodes };
      updateGraph();
    },
    onEdgeClick: (edgeId: string) => {
      const edges = new Set(currentSelection.edges);
      if (edges.has(edgeId)) {
        edges.delete(edgeId);
      } else {
        edges.add(edgeId);
      }
      currentSelection = { ...currentSelection, edges };
      updateGraph();
    },
  };

  if (!graphView) {
    graphView = renderGraph(graphElement, currentGraph, options);
  } else {
    graphView.setGraph(currentGraph, options);
  }

  summaryElement.textContent = `${currentGraph.nodes.size} nodes, ${currentGraph.edges.size} edges, version ${currentGraph.version}`;
}

loadGraph().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  graphElement.textContent = message;
  summaryElement.textContent = "Failed to load graph snapshot";
});

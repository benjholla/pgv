import {
  graphSnapshotFromJson,
  renderGraph,
  verticalLayout,
  type GraphSnapshot,
  type GraphSnapshotJson,
  type SelectionState,
  createGraphDiff,
} from "../../../src";
import "../../../src/style.css";
import "./demo.css";

const graphElement = requireElement("#graph");
const summaryElement = requireElement("#graph-summary");
const applyDiffAddBtn = requireElement("#apply-diff-add");
const applyDiffRemoveBtn = requireElement("#apply-diff-remove");

let currentGraph: GraphSnapshot | null = null;
let currentSelection: SelectionState = {
  nodes: new Set(),
  edges: new Set(),
};
let graphView: any = null;

const layoutOptions = {
  nodeWidth: 240,
  nodeHeight: 94,
  layerSpacing: 152,
  nodeSpacing: 290,
  margin: 36,
};

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

  updateGraph();
}

function updateGraph(): void {
  if (!currentGraph) return;

  const options = {
    layoutOptions,
    selection: currentSelection,
    usePanZoom: true,
    useThemeToggle: true,
    maxHistory: 10,
    useSearch: true,
    onGraphChange: (graph: GraphSnapshot) => {
      currentGraph = graph;
      summaryElement.textContent = `${graph.nodes.size} nodes, ${graph.edges.size} edges, version ${graph.version}`;
    },
    onThemeChange: (theme: string) => {
      document.documentElement.classList.remove("pgv-light", "pgv-dark", "pgv-auto");
      document.documentElement.classList.add(`pgv-${theme}`);
    },
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
    onSelectionChange: (selection: SelectionState) => {
      currentSelection = selection;
      updateGraph();
    },
  };

  if (!graphView) {
    graphView = renderGraph(graphElement, currentGraph, options);
  } else {
    graphView.updateOptions(options);
  }

  summaryElement.textContent = `${currentGraph.nodes.size} nodes, ${currentGraph.edges.size} edges, version ${currentGraph.version}`;
}

let versionCounter = 2;

applyDiffAddBtn.addEventListener("click", () => {
  if (!graphView) return;
  const diff = createGraphDiff({
    addedNodes: [
      {
        id: `new-node-${versionCounter}`,
        tags: ["decision"],
        attributes: {
          label: `New Node ${versionCounter}`,
          kind: "added",
        },
      },
    ],
    addedEdges: [
      {
        id: `new-edge-${versionCounter}`,
        source: "entry",
        target: `new-node-${versionCounter}`,
        tags: ["true"],
        attributes: {
          label: "Added path",
        },
      },
    ],
    removedNodes: [],
    removedEdges: [],
  });

  try {
    graphView.applyDiff(diff, versionCounter++);
  } catch (e: any) {
    alert(e.message);
  }
});

applyDiffRemoveBtn.addEventListener("click", () => {
  if (!graphView) return;
  const diff = createGraphDiff({
    addedNodes: [],
    addedEdges: [],
    removedNodes: ["init"],
    removedEdges: ["entry-to-init", "init-to-condition"],
  });

  try {
    graphView.applyDiff(diff, versionCounter++);
  } catch (e: any) {
    alert(e.message);
  }
});

loadGraph().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  graphElement.textContent = message;
  summaryElement.textContent = "Failed to load graph snapshot";
});

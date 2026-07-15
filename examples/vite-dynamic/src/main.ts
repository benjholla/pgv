import {
  createGraphSnapshot,
  GraphView,
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
let currentSchema: any = {};
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
  const [graphRes, schemaRes] = await Promise.all([
    fetch("http://localhost:8080/api/graphs/cfg-main"),
    fetch("http://localhost:8080/api/graphs/cfg-main/schema")
  ]);

  if (!graphRes.ok) {
    throw new Error(`Unable to load graph JSON: ${graphRes.status}`);
  }
  if (!schemaRes.ok) {
    throw new Error(`Unable to load schema JSON: ${schemaRes.status}`);
  }

  const json = (await graphRes.json()) as GraphSnapshotJson;
  currentGraph = createGraphSnapshot(json);
  currentSchema = await schemaRes.json();

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
    onGraphChange: (graph: GraphSnapshot) => {
      currentGraph = graph;
      summaryElement.textContent = `${graph.nodes.size} nodes, ${graph.edges.size} edges`;
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
    graphView = new GraphView(graphElement, options);
    graphView.setGraph(currentGraph);
  } else {
    graphView.updateOptions(options);
  }

  summaryElement.textContent = `${currentGraph.nodes.size} nodes, ${currentGraph.edges.size} edges`;
}

let diffCounter = 2;

applyDiffAddBtn.addEventListener("click", () => {
  if (!graphView) return;
  const diff = createGraphDiff({
    addedNodes: [
      {
        id: `new-node-${diffCounter}`,
        tags: ["XCSG.ControlFlow_Node", "XCSG.Loop"],
        attributes: {
          "XCSG.name": `New Node ${diffCounter}`,

        },
      },
    ],
    addedEdges: [
      {
        id: `new-edge-${diffCounter}`,
        source: "entry",
        target: `new-node-${diffCounter}`,
        tags: ["XCSG.ControlFlow_Edge"],
        attributes: {
          "XCSG.name": "Added path",
        },
      },
    ],
    removedNodes: [],
    removedEdges: [],
  });

  try {
    graphView.applyDiff(diff);
    diffCounter++;
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
    graphView.applyDiff(diff);
    diffCounter++;
  } catch (e: any) {
    alert(e.message);
  }
});

loadGraph().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  graphElement.textContent = message;
  summaryElement.textContent = "Failed to load graph snapshot";
});

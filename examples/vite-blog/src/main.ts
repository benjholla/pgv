import {
  createGraphSnapshot,
  GraphView,
  type GraphSnapshot,
  type GraphSnapshotJson,
  type SelectionState,
} from "../../../src";
import "../../../src/style.css";
import "./demo.css";

const graph1Element = requireElement("#graph1");
const graph2Element = requireElement("#graph2");

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

class GraphController {
  private currentGraph: GraphSnapshot | null = null;
  private currentSelection: SelectionState = {
    nodes: new Set(),
    edges: new Set(),
  };
  private currentTheme: "light" | "dark" = "light";
  private graphView: GraphView | null = null;

  constructor(private container: HTMLElement, private schema: any) {}

  setGraph(graph: GraphSnapshot) {
    this.currentGraph = graph;
    this.updateGraph();
  }

  private updateGraph(): void {
    if (!this.currentGraph) return;

    const options = {
      layoutOptions,
      selection: this.currentSelection,
      usePanZoom: true,
      useThemeToggle: true,
      maxHistory: 0,
      theme: this.currentTheme, // Default to light mode as requested for clinical blog
      controlsCollapsed: true,
      onGraphChange: (graph: GraphSnapshot) => {
        this.currentGraph = graph;
      },
      onThemeChange: (theme: "light" | "dark") => {
        this.currentTheme = theme;
      },
      onNodeClick: (nodeId: string) => {
        const nodes = new Set(this.currentSelection.nodes);
        if (nodes.has(nodeId)) {
          nodes.delete(nodeId);
        } else {
          nodes.add(nodeId);
        }
        this.currentSelection = { ...this.currentSelection, nodes };
        this.updateGraph();
      },
      onEdgeClick: (edgeId: string) => {
        const edges = new Set(this.currentSelection.edges);
        if (edges.has(edgeId)) {
          edges.delete(edgeId);
        } else {
          edges.add(edgeId);
        }
        this.currentSelection = { ...this.currentSelection, edges };
        this.updateGraph();
      },
      onSelectionChange: (selection: SelectionState) => {
        this.currentSelection = selection;
        this.updateGraph();
      },
    };

    if (!this.graphView) {
      this.graphView = new GraphView(this.container, this.schema, options);
      this.graphView.setGraph(this.currentGraph);
    } else {
      this.graphView.updateOptions(options);
    }
  }
}

async function loadGraphs(): Promise<void> {
  const [graphRes, schemaRes] = await Promise.all([
    fetch("./sample-cfg.json"),
    fetch("./sample-schema.json")
  ]);

  if (!graphRes.ok) {
    throw new Error(`Unable to load graph JSON: ${graphRes.status}`);
  }
  if (!schemaRes.ok) {
    throw new Error(`Unable to load schema JSON: ${schemaRes.status}`);
  }

  const json = (await graphRes.json()) as GraphSnapshotJson;
  const initialGraph = createGraphSnapshot(json);
  const schema = await schemaRes.json();

  const controller1 = new GraphController(graph1Element, schema);
  controller1.setGraph(initialGraph);

  const controller2 = new GraphController(graph2Element, schema);
  controller2.setGraph(initialGraph);
}

loadGraphs().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  graph1Element.textContent = message;
  graph2Element.textContent = message;
});

import {
  createGraphSnapshot,
  applyGraphDiff,
  type GraphDiff,
  GraphView,
  type GraphSchema,
  type GraphSnapshot,
  type GraphSnapshotJson,
} from "../../../src";
import "../../../src/style.css";

const graphElement = document.getElementById("graph") as HTMLElement;

let currentGraph: GraphSnapshot | null = null;
let currentSchema: GraphSchema = {};
let graphView: GraphView | null = null;

const layoutOptions = {
  nodeWidth: 240,
  nodeHeight: 94,
  layerSpacing: 152,
  nodeSpacing: 290,
  margin: 36,
};

function updateGraph(): void {
  if (!currentGraph) return;

  const options = {
    layoutOptions,
    usePanZoom: false,
    useThemeToggle: false,
    maxHistory: 0,
  };

  // Always recreate GraphView if schema changes, or just recreate it every time to be safe for tests
  graphElement.innerHTML = '';
  graphView?.destroy();
  graphView = new GraphView(graphElement, currentSchema, options);
  graphView.setGraph(currentGraph);
}

// Expose a way for e2e tests to inject a new graph directly
(window as unknown as { __setTestGraph: (json: unknown) => void }).__setTestGraph = (json: unknown) => {
  currentGraph = createGraphSnapshot(json as GraphSnapshotJson);
  currentSchema = (json as GraphSnapshotJson).schema || {};
  updateGraph();
};

(window as unknown as { __applyGraphDiff: (diffJson: unknown) => void }).__applyGraphDiff = (diffJson: unknown) => {
  if (!currentGraph || !graphView) return;
  const diff = diffJson as GraphDiff;
  currentGraph = applyGraphDiff(currentGraph, diff);
  graphView.applyDiff(diff);
};

// Also load the default sample graph initially to test default rendering
async function loadDefaultGraph() {
  try {
    // Because Vite runs at the root, the path to the public assets handled by publicDir
    // will just be relative when not bundled. But let's try direct to be safe
    const graphRes = await fetch("./sample-cfg.json");
    if (graphRes.ok) {
      const json = await graphRes.json();
      currentGraph = createGraphSnapshot(json);
      currentSchema = json.schema || {};
      updateGraph();
    }
  } catch (e) {
    console.error("Failed to load default graph", e);
  }
}

loadDefaultGraph();

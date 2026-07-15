import {
  createGraphSnapshot,
  GraphView,
  type GraphSnapshot,
  type GraphSnapshotJson,
} from "../../../src";
import "../../../src/style.css";

const graphElement = document.getElementById("graph") as HTMLElement;

let currentGraph: GraphSnapshot | null = null;
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

  if (!graphView) {
    graphView = new GraphView(graphElement, options);
    graphView.setGraph(currentGraph);
  } else {
    graphView.setGraph(currentGraph);
  }
}

// Expose a way for e2e tests to inject a new graph directly
(window as any).__setTestGraph = (json: GraphSnapshotJson) => {
  currentGraph = createGraphSnapshot(json);
  updateGraph();
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
      updateGraph();
    }
  } catch (e) {
    console.error("Failed to load default graph", e);
  }
}

loadDefaultGraph();

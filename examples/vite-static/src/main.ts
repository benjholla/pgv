import {
  graphSnapshotFromJson,
  renderGraph,
  verticalLayout,
  type GraphSnapshotJson,
} from "../../../src";
import "../../../src/style.css";
import "./demo.css";

const graphElement = document.querySelector<HTMLElement>("#graph");
const summaryElement = document.querySelector<HTMLElement>("#graph-summary");

if (!graphElement || !summaryElement) {
  throw new Error("Demo shell is missing required graph elements.");
}

async function loadGraph(): Promise<void> {
  const response = await fetch("/sample-cfg.json");

  if (!response.ok) {
    throw new Error(`Unable to load graph JSON: ${response.status}`);
  }

  const json = (await response.json()) as GraphSnapshotJson;
  const graph = graphSnapshotFromJson(json);
  const layout = verticalLayout(graph, {
    nodeWidth: 240,
    nodeHeight: 94,
    layerSpacing: 152,
    nodeSpacing: 290,
    margin: 36,
  });

  renderGraph(graphElement, graph, { layout });
  summaryElement.textContent = `${graph.nodes.size} nodes, ${graph.edges.size} edges, version ${graph.version}`;
}

loadGraph().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  graphElement.textContent = message;
  summaryElement.textContent = "Failed to load graph snapshot";
});

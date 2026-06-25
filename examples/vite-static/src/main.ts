import {
  graphSnapshotFromJson,
  renderGraph,
  verticalLayout,
  type GraphSnapshotJson,
} from "../../../src";
import "../../../src/style.css";
import "./demo.css";

const graphElement = requireElement("#graph");
const summaryElement = requireElement("#graph-summary");

function requireElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Demo shell is missing "${selector}".`);
  }

  return element;
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

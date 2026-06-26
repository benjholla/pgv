cat << 'DIFF' > main.diff
--- examples/vite-static/src/main.ts
+++ examples/vite-static/src/main.ts
@@ -1,7 +1,9 @@
 import {
   graphSnapshotFromJson,
   renderGraph,
   verticalLayout,
   type GraphSnapshot,
   type GraphSnapshotJson,
   type SelectionState,
+  createGraphDiff,
 } from "../../../src";
 import "../../../src/style.css";
 import "./demo.css";

 const graphElement = requireElement("#graph");
 const summaryElement = requireElement("#graph-summary");
+const applyDiffAddBtn = requireElement("#apply-diff-add");
+const applyDiffRemoveBtn = requireElement("#apply-diff-remove");

 let currentGraph: GraphSnapshot | null = null;
@@ -48,6 +51,9 @@
     selection: currentSelection,
     usePanZoom: true,
     useThemeToggle: true,
+    maxHistory: 10,
+    onGraphChange: (graph: GraphSnapshot) => {
+      summaryElement.textContent = `${graph.nodes.size} nodes, ${graph.edges.size} edges, version ${graph.version}`;
+    },
     onThemeChange: (theme: string) => {
       document.documentElement.classList.remove("pgv-light", "pgv-dark", "pgv-auto");
@@ -83,6 +89,61 @@
   summaryElement.textContent = `${currentGraph.nodes.size} nodes, ${currentGraph.edges.size} edges, version ${currentGraph.version}`;
 }

+let versionCounter = 2;
+
+applyDiffAddBtn.addEventListener("click", () => {
+  if (!graphView) return;
+  const diff = createGraphDiff({
+    addedNodes: [
+      {
+        id: `new-node-${versionCounter}`,
+        tags: ["decision"],
+        attributes: {
+          label: `New Node ${versionCounter}`,
+          kind: "added",
+        },
+      },
+    ],
+    addedEdges: [
+      {
+        id: `new-edge-${versionCounter}`,
+        source: "entry",
+        target: `new-node-${versionCounter}`,
+        tags: ["true"],
+        attributes: {
+          label: "Added path",
+        },
+      },
+    ],
+    removedNodes: [],
+    removedEdges: [],
+  });
+
+  try {
+    graphView.applyDiff(diff, versionCounter++);
+  } catch (e: any) {
+    alert(e.message);
+  }
+});
+
+applyDiffRemoveBtn.addEventListener("click", () => {
+  if (!graphView) return;
+  const diff = createGraphDiff({
+    addedNodes: [],
+    addedEdges: [],
+    removedNodes: ["init"],
+    removedEdges: ["entry-to-init", "init-to-condition"],
+  });
+
+  try {
+    graphView.applyDiff(diff, versionCounter++);
+  } catch (e: any) {
+    alert(e.message);
+  }
+});
+
 loadGraph().catch((error: unknown) => {
   const message = error instanceof Error ? error.message : String(error);

DIFF
patch -p0 < main.diff

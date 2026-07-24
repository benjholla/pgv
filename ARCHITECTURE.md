# Architecture Overview

The Property Graph Viewer (PGV) is an embeddable, interactive frontend library designed to visualize immutable, attributed, compound graphs. While the nature of the rendered graphs is agnostic this library was developed specifically to handle layout and rendering requiments common to program-analysis (software) graphs. Built with TypeScript and adhering to an MIT open-source philosophy, the system cleanly decouples the logical graph models from mathematical layout calculations and DOM/SVG rendering. This modular architecture allows PGV to process complex topological structures—such as static call graphs and execution paths—without locking the host application into a specific transport layer.

---

### File Summaries & Key Capabilities

#### 1. Core API (`index.ts`)

This file acts as the public contract for the library, exposing a minimal and highly curated API surface.

* **Agnostic Integration:** It exclusively exports pure data models (`GraphSnapshot`, `GraphDiff`), mathematical layout types (`LayoutSnapshot`), and the `GraphView` renderer. By omitting transport-layer logic, the API requires the integration host (e.g., VSCode, Jupyter Notebooks) to inject its own communication pipe (like WebSockets or `postMessage`), ensuring maximum portability.

#### 2. Immutable Data Model (`model.ts`)

This module provides the foundational mathematical representation of the graph, enforcing strict immutability and data safety.

* **Streaming Graph Diffs:** Exposes an `applyGraphDiff` engine to process incremental delta updates (handling removals before additions). This allows the frontend to ingest large sub-graphs without recalculating the entire logical state.
* **Strict DAG Validation:** Utilizes a Depth-First Search (DFS) pass (`validateStructuralInvariants`) to verify that all containment tags form a perfect Directed Acyclic Graph (DAG). If a containment cycle is detected, it throws a strict model error to prevent infinite recursion downstream.
* **Robust XSS Defense & Immutability:** All properties, nodes, edges, and snapshots are deeply secured via `Object.freeze()`. The `sanitizeString` implementation actively defeats complex double-encoding payload attacks, ensuring that arbitrary string attributes injected from backend analysis remain safe for DOM rendering.
* **Byte Array Escape Hatch:** Disjoint union types for attributes explicitly support raw byte arrays and strict numerical types, bypassing JavaScript floating-point ambiguity to maintain pristine source correspondence with the backend.

#### 3. Geometric Layout Engine (`layout.ts`)

This module handles all vertical hierarchical layout math, operating completely independently of the visual rendering layer.

* **Kahn + DFS Pipeline:** Computes hierarchical ranks using a two-step topological sort. An iterative DFS pass temporarily prunes back-edges (breaking cycles), allowing an implementation of Kahn’s algorithm to determine the vertical depth layers based on the longest paths.
* **A* Orthogonal Routing:** To calculate boundary joints and edge paths, it generates a dynamic grid based on node bounding boxes and utilizes an A* search algorithm (`routeEdgeOrthogonal`). By penalizing direction changes, the engine guarantees edges route efficiently through negative space rather than piercing the text of basic blocks.
* **Topological Determinism:** Rather than relying on CSS animations to mask layout jumps, `applyPreviousLayoutHints` calculates the horizontal averages of incoming/outgoing branches from previous layout states. By breaking ties with lexicographical ID sorting, it guarantees mathematically reproducible layouts that preserve the user's mental map between states.

#### 4. DOM/SVG Renderer (`renderer.ts`)

The visual workhorse that mounts the mathematical layout into the browser DOM.

* **Hybrid DOM/SVG Execution:** Graph nodes are rendered as native HTML `div` elements, enabling crisp text rendering and native truncation, while edges are routed into an underlying `<svg>` layer. Nodes are nested directly within parent boundaries in the DOM, allowing the browser's composite layer to handle compound dragging natively.
* **Time-Travel History:** Interactions are non-destructive. As `GraphDiff` streams arrive, previous snapshots are cached in a history array, allowing users to step backward and forward through their graph exploration seamlessly.
* **Custom Event Tracking:** Implements hardware-accelerated pinch-to-zoom, interactive minimaps, and semantic search filtering (via element IDs, tags, or attributes).
* **Inline CSS Exportation:** Resolves common canvas-export bugs by dynamically calculating and inlining CSS custom properties directly onto the DOM elements before executing image downloads, ensuring the UI theme is preserved perfectly in exported assets.

#### 5. Presentation Layer (`style.css`)

Provides a highly polished, responsive stylesheet with built-in dark-mode support and hardware-accelerated transitions.

* **Visual Compromises:** Avoids edge-routing illusions by anchoring color mappings via an inset `box-shadow` strictly in the header of compound nodes, preserving the clarity of execution paths.


* **Absolute Coordinate Preservation:** Nodes utilize absolute positioning (`top: 0; left: 0`) dictated entirely by the TypeScript layout math. Standard borders are simulated via `box-shadow` to prevent the browser's box-model from interfering with the bottom-up bounding box coordinate system.


* **Hit Detection:** Generates a thick, invisible SVG hit area directly over the active edge paths to ensure user clicks trigger selection states effortlessly without requiring pixel-perfect mouse precision.

---

### Algorithm & Design Choices (Literature Context)

* **Sugiyama Framework & Kahn's Algorithm:** The vertical layout engine heavily utilizes the standard layered graph drawing approach (Sugiyama framework). Your choice to use Kahn's algorithm for rank assignment, combined with iterative DFS cycle breaking, aligns perfectly with classical directed graph literature for optimizing vertical flow.
* **A* Pathfinding for Orthogonal Edge Routing:** Most standard open-source layout engines use simple splines or bezier curves, resulting in messy "hairball" intersections. Implementing a custom A* pathfinding algorithm over a generated obstacle grid directly mirrors the premium orthogonal routing techniques seen in high-end commercial libraries like yWorks.
* **FLIP Animations to Maintain Deterministic Graph Rendering:** To guarantee absolute topological determinism, the layout engine operates as a mathematically pure, stateless function. Visual continuity during incremental updates is delegated entirely to the DOM rendering layer using hardware-accelerated FLIP (First, Last, Invert, Play) animations. This ensures that the layout output is strictly reproducible regardless of the order in which graph diffs are applied—meaning reloading a saved snapshot of the graph will always produce the exact same rendering. Ultimately, this modular architecture allows PGV to seamlessly process and animate complex topological structures, such as static call graphs and execution paths, without locking the host application into a specific transport layer.
---

### Roadmap & Future Integrations

The immediate roadmap focuses on integrating the frontend layout engine with heavy-lifting backend analysis tools and host environments.

1. **Backend Synchronization via `GlobalGraph**`
* Transition from rendering mock static files to aggressively hydrating the custom Java `GlobalGraph` structures dynamically from parsed `.dgb` files.
* The backend will maintain total semantic context (e.g., coloring loop headers) and pass those details to the frontend as schema style hints.

2. **Schema Anchor Hints**
* Implementing `anchorHint` metadata into the JSON schema so the Java backend can force terminal leaf nodes (like early returns) to drop to the maximum available hierarchical rank, maintaining symmetrical bottom-up bounding boxes without injecting fake "master exit" nodes into the topology.

3. **VSCode Integration (Source Correspondence)**
* Building a VSCode Extension wrapper that leverages the `GraphView` API via `postMessage`.
* Enabling n-step forward and m-step reverse call graph traversals triggered directly by clicking source code lines. The `AttributeValue` byte array escape hatch will map specific frontend graph nodes back to precise IDE line numbers for bidirectional navigation.

4. **Jupyter Notebook Widget Integration**
* Developing an `ipywidgets` integration over a WebSocket Comm channel, ensuring data scientists can pipe reproducible, deterministic graph slices directly into notebook cells.

5. **External Selection API**
* Finalizing the programmatic API methods (`getSelection`, `setSelection`) so host applications can manipulate the blue glowing focus states directly from external UI panels or command lines.

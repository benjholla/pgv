const fs = require('fs');
let code = fs.readFileSync('src/layout.ts', 'utf8');

// Replace verticalLayout start
const oldFunc = `export function verticalLayout(
  graph: GraphSnapshot,
  options: VerticalLayoutOptions = {},
  previousLayout?: LayoutSnapshot,
): LayoutSnapshot {
  const config = { ...DEFAULT_VERTICAL_LAYOUT, ...options };
  // Sort node IDs to guarantee determinism in layout regardless of input map iteration order
  const nodeIds = new Array<string>(graph.nodes.size);
  let nIdx = 0;
  for (const id of graph.nodes.keys()) {
    nodeIds[nIdx++] = id;
  }
  nodeIds.sort();
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const edgeOutgoing = new Map<string, string[]>();
  const edgeIncoming = new Map<string, string[]>();

  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
    edgeOutgoing.set(id, []);
    edgeIncoming.set(id, []);
  }

  for (const edge of graph.edges.values()) {
    // Note: We always need to add to edgeOutgoing and edgeIncoming even if nodes are missing
    // or if it's a self loop, to maintain behavior of staggering calculation later.
    if (!edgeOutgoing.has(edge.source)) edgeOutgoing.set(edge.source, []);
    if (!edgeIncoming.has(edge.target)) edgeIncoming.set(edge.target, []);
    edgeOutgoing.get(edge.source)!.push(edge.id);
    edgeIncoming.get(edge.target)!.push(edge.id);

    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  }`;

const newFunc = `export function verticalLayout(
  graph: GraphSnapshot,
  options: VerticalLayoutOptions = {},
  previousLayout?: LayoutSnapshot,
): LayoutSnapshot {
  const config = { ...DEFAULT_VERTICAL_LAYOUT, ...options };

  // Identify nodes hidden inside collapsed parents
  const hiddenNodes = new Set<string>();
  const activeCollapsedAncestors = new Map<string, string>(); // hidden node -> visible collapsed ancestor

  const collapsedNodes = config.collapsedNodes || new Set<string>();

  // DFS to find hidden nodes
  for (const [id, node] of graph.nodes) {
    let current = node.parent;
    let collapsedAncestor: string | null = null;
    while (current) {
      if (collapsedNodes.has(current)) {
        collapsedAncestor = current;
        // Don't break immediately, find the highest collapsed ancestor?
        // Actually, any collapsed ancestor makes it hidden.
        // Highest is better for lifting edges.
      }
      current = graph.nodes.get(current)?.parent;
    }

    if (collapsedAncestor) {
      hiddenNodes.add(id);
      activeCollapsedAncestors.set(id, collapsedAncestor);
    }
  }

  // Filter out expanded parents from grid layout (they get bounds bottom-up)
  const isExpandedParent = new Set<string>();
  for (const [id, node] of graph.nodes) {
    if (node.parent && !collapsedNodes.has(node.parent) && !hiddenNodes.has(node.parent)) {
      isExpandedParent.add(node.parent);
    }
  }

  // Active nodes are leaf nodes and collapsed parents (not hidden)
  const layoutNodeIds: string[] = [];
  for (const id of graph.nodes.keys()) {
    if (!hiddenNodes.has(id) && !isExpandedParent.has(id)) {
      layoutNodeIds.push(id);
    }
  }
  layoutNodeIds.sort();

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const edgeOutgoing = new Map<string, string[]>();
  const edgeIncoming = new Map<string, string[]>();

  // Initialize only for active grid layout nodes
  for (const id of layoutNodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
  }

  // Keep edge tracking for all nodes to support original staggered edge calculation later
  for (const id of graph.nodes.keys()) {
    edgeOutgoing.set(id, []);
    edgeIncoming.set(id, []);
  }

  // We filter containment edges. We can find them from schema.
  const containmentTags = new Set(graph.schema?.containment ?? []);

  for (const edge of graph.edges.values()) {
    // Lift edges to collapsed ancestors
    const effectiveSource = activeCollapsedAncestors.get(edge.source) || edge.source;
    const effectiveTarget = activeCollapsedAncestors.get(edge.target) || edge.target;

    // Skip containment edges completely for geometric grid
    let isContainment = false;
    for (const tag of edge.tags) {
      if (containmentTags.has(tag)) {
        isContainment = true;
        break;
      }
    }

    // For edge stagger calculation, we use original source/target, but maybe we shouldn't draw it if hidden
    // Keep edge staggering for now, only stagger if both endpoints are visible?
    if (!hiddenNodes.has(edge.source)) {
      edgeOutgoing.get(edge.source)!.push(edge.id);
    }
    if (!hiddenNodes.has(edge.target)) {
      edgeIncoming.get(edge.target)!.push(edge.id);
    }

    if (isContainment) continue;

    if (!graph.nodes.has(effectiveSource) || !graph.nodes.has(effectiveTarget)) {
      continue;
    }

    // Only add to grid adjacency if both are grid layout participants (not expanded parents)
    // Wait, if an edge connects to an expanded parent, we shouldn't route it to the parent in the grid
    // We should route it to the closest layout child, or maybe we just ignore it in the grid topological sort?
    // Let's only add to adjacency if both are layoutNodeIds (this effectively ignores edges to/from expanded parents for grid sorting)
    if (outgoing.has(effectiveSource) && incoming.has(effectiveTarget) && effectiveSource !== effectiveTarget) {
      outgoing.get(effectiveSource)!.push(effectiveTarget);
      incoming.get(effectiveTarget)!.push(effectiveSource);
    }
  }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/layout.ts', code);

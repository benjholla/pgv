import { verticalLayout, edgeEndpoints } from "./src/layout";
import { GraphSnapshot, GraphEdge } from "./src/model";

const parentId = "parent";

const graph = {
  nodes: new Map([
    [parentId, { id: parentId, attributes: {}, tags: new Set() }],
    ["child1", { id: "child1", attributes: {}, tags: new Set() }],
    ["child2", { id: "child2", attributes: {}, tags: new Set() }],
    ["child3", { id: "child3", attributes: {}, tags: new Set() }],
    ["source", { id: "source", attributes: {}, tags: new Set() }]
  ]),
  edges: new Map([
    ["e1", { id: "e1", source: parentId, target: "child1", attributes: {}, tags: new Set(["containment"]) }],
    ["e2", { id: "e2", source: parentId, target: "child2", attributes: {}, tags: new Set(["containment"]) }],
    ["e3", { id: "e3", source: parentId, target: "child3", attributes: {}, tags: new Set(["containment"]) }],
    ["s1", { id: "s1", source: "source", target: "child1", attributes: {}, tags: new Set() }],
    ["s2", { id: "s2", source: "source", target: "child2", attributes: {}, tags: new Set() }],
    ["s3", { id: "s3", source: "source", target: "child3", attributes: {}, tags: new Set() }]
  ])
} as any as GraphSnapshot;

const layout = verticalLayout(graph, { containmentTags: new Set(["containment"]) });

const ep1 = edgeEndpoints(graph.edges.get("s1")!, layout);
const ep2 = edgeEndpoints(graph.edges.get("s2")!, layout);
const ep3 = edgeEndpoints(graph.edges.get("s3")!, layout);

console.log("ep1 source:", ep1?.source);
console.log("ep2 source:", ep2?.source);
console.log("ep3 source:", ep3?.source);

console.log("ep1 path:", ep1?.path);
console.log("ep2 path:", ep2?.path);
console.log("ep3 path:", ep3?.path);

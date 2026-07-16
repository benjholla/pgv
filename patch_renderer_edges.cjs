const fs = require('fs');
let code = fs.readFileSync('src/renderer.ts', 'utf8');

const oldFunc = `  svg.appendChild(createArrowMarker(markerId));
  edgeLayer.classList.add("pgv-edge-layer-inner");
  svg.appendChild(edgeLayer);
  for (const edge of graph.edges.values()) {
    const endpoints = edgeEndpoints(edge, layout);`;

const newFunc = `  svg.appendChild(createArrowMarker(markerId));
  edgeLayer.classList.add("pgv-edge-layer-inner");
  svg.appendChild(edgeLayer);

  const containmentTags = new Set(graph.schema?.containment ?? []);

  for (const edge of graph.edges.values()) {
    // Skip containment edges explicitly from rendering
    let isContainment = false;
    for (let i = 0; i < edge.tags.length; i++) {
      if (containmentTags.has(edge.tags[i])) {
        isContainment = true;
        break;
      }
    }
    if (isContainment) continue;

    const endpoints = edgeEndpoints(edge, layout);`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/renderer.ts', code);

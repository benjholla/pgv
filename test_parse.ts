import { JSDOM } from "jsdom";
const dom = new JSDOM();
const document = dom.window.document;

function createSvgElement(tag: string, attrs: Record<string, string>, children: Node[] = []): SVGElement {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  for (const child of children) {
    el.appendChild(child);
  }
  return el;
}

const svg = createSvgElement("svg", {
  viewBox: "0 0 24 24",
  width: "16",
  height: "16",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, [
  createSvgElement("circle", { cx: "12", cy: "12", r: "10" }),
  createSvgElement("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
  createSvgElement("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
]);

console.log(svg.outerHTML);

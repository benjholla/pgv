import { bench, describe } from "vitest";

// Simulation of current
function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
function tagToClassName(tag: string): string {
  return "tag-" + tag;
}

const tags = ["abc", "def", "ghi", "jk", "lmn", "opq"];
const isSelected = true;

describe("className builder complex", () => {
  bench("current joinClassNames with map", () => {
    const classNames = [
      "graph-node",
      "pgv-graph-node",
      ...tags.map(tagToClassName),
    ];
    if (isSelected) {
      classNames.push("pgv-selected");
    }
    const className = joinClassNames(...classNames);
  });

  bench("optimized string builder inline", () => {
    let className = "graph-node pgv-graph-node";
    for (let i = 0; i < tags.length; i++) {
       className += " " + tagToClassName(tags[i]);
    }
    if (isSelected) {
       className += " pgv-selected";
    }
  });
});

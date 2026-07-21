import { bench, describe } from "vitest";

// Simulation of current
function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
function tagToClassName(tag: string): string {
  return "tag-" + tag;
}

const tags = ["abc", "def", "ghi"];
const isSelected = true;

describe("className builder", () => {
  bench("current joinClassNames", () => {
    const className = joinClassNames(
      "pgv-graph-node",
      ...tags.map(tagToClassName),
      isSelected ? "pgv-selected" : undefined,
    );
  });

  bench("optimized string builder", () => {
    let className = "pgv-graph-node";
    for (let i = 0; i < tags.length; i++) {
       className += " " + tagToClassName(tags[i]);
    }
    if (isSelected) {
       className += " pgv-selected";
    }
  });
});

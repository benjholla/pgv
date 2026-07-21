import { bench, describe } from "vitest";

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function optimizedJoinClassNames(...classNames: Array<string | undefined>): string {
  let result = "";
  for (let i = 0; i < classNames.length; i++) {
    const className = classNames[i];
    if (className) {
      if (result) {
        result += " " + className;
      } else {
        result = className;
      }
    }
  }
  return result;
}

describe("joinClassNames", () => {
  bench("filter.join", () => {
    joinClassNames("pgv-graph-view", "pgv-pan-zoom", undefined, "pgv-dark", "custom-class");
  });

  bench("optimized loop", () => {
    optimizedJoinClassNames("pgv-graph-view", "pgv-pan-zoom", undefined, "pgv-dark", "custom-class");
  });
});

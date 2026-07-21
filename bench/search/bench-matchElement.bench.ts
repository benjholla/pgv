import { bench, describe } from "vitest";

const element = {
  id: "n1",
  tags: ["level1", "important", "test"],
  attributes: {
    label: "Node 1",
    value: 42,
    active: true,
    data: null,
    nested: { a: 1 }
  }
};

const valueMatcher = (t: string) => t === "42";
const keyMatcher = (t: string) => t === "value";
const searchKeyQuery = "value";
const searchQuery = "42";

describe("matchElement optimizations", () => {
  bench("current matchElement (all)", () => {
    const mode = "all";
    if (mode === "all") {
      if (valueMatcher(element.id)) return true;
      for (let i = 0; i < element.tags.length; i++) {
        if (valueMatcher(element.tags[i])) return true;
      }
      for (const k in element.attributes) {
        if (Object.prototype.hasOwnProperty.call(element.attributes, k)) {
          if (valueMatcher(k)) return true;
          const v = element.attributes[k];
          if (v !== null && typeof v !== 'object') {
            if (valueMatcher(String(v))) return true;
          }
        }
      }
      return false;
    }
  });
});

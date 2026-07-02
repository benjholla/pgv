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

describe("Search matching", () => {
  bench("current matchElement (all)", () => {
    let result = false;
    if (valueMatcher(element.id)) { result = true; return; }
    if (element.tags.some(tag => valueMatcher(tag))) { result = true; return; }
    for (const [k, v] of Object.entries(element.attributes)) {
      if (valueMatcher(k)) { result = true; return; }
      if (v !== null && typeof v !== 'object') {
        if (valueMatcher(String(v))) { result = true; return; }
      }
    }
  });

  bench("optimized matchElement (all)", () => {
    let result = false;
    if (valueMatcher(element.id)) { result = true; return; }
    const tags = element.tags;
    for (let i = 0; i < tags.length; i++) {
      if (valueMatcher(tags[i])) { result = true; return; }
    }
    const attrs = element.attributes;
    for (const k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) {
        if (valueMatcher(k)) { result = true; return; }
        const v = attrs[k as keyof typeof attrs];
        if (v !== null && typeof v !== 'object') {
          if (valueMatcher(String(v))) { result = true; return; }
        }
      }
    }
  });
});

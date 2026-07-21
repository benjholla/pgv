import { bench, describe } from "vitest";

const attributes = {
  a: 1, b: 2, c: "test", d: true, e: null, f: { nested: true }
};

describe("Object iteration", () => {
  bench("Object.entries", () => {
    let matched = false;
    for (const [k, v] of Object.entries(attributes)) {
      if (k === "c") {
        matched = true;
      }
    }
  });

  bench("for..in", () => {
    let matched = false;
    for (const k in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, k)) {
        if (k === "c") {
          matched = true;
        }
      }
    }
  });
});

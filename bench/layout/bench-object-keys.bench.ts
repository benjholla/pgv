import { bench, describe } from "vitest";

describe("Object.keys vs for...in", () => {
  const obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };

  bench("Object.keys(obj).length", () => {
    const len = Object.keys(obj).length;
  });

  bench("for...in loop", () => {
    let len = 0;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        len++;
      }
    }
  });
});

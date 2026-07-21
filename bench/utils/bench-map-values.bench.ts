import { bench, describe } from "vitest";

describe("Map iteration", () => {
  const map = new Map();
  for (let i = 0; i < 10000; i++) {
    map.set(String(i), i);
  }

  bench("for...of map.values()", () => {
    let count = 0;
    for (const val of map.values()) {
      count += val;
    }
    return count;
  });

  bench("forEach", () => {
    let count = 0;
    map.forEach((val) => {
      count += val;
    });
    return count;
  });
});

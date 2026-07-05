import { bench, describe } from "vitest";

describe("Map entries", () => {
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

  bench("Array.from(map.values()) then for loop", () => {
    let count = 0;
    const vals = Array.from(map.values());
    for (let i = 0; i < vals.length; i++) {
      count += vals[i];
    }
    return count;
  });
});

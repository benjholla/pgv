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

  bench("Array.from(map.values()) then for loop", () => {
    let count = 0;
    const vals = Array.from(map.values());
    for (let i = 0; i < vals.length; i++) {
      count += vals[i];
    }
    return count;
  });

  bench("for...of map.entries()", () => {
    let count = "";
    let val = 0;
    for (const [k, v] of map.entries()) {
      count = k;
      val += v;
    }
    return val + count.length;
  });

  bench("for...of map", () => {
    let count = "";
    let val = 0;
    for (const [k, v] of map) {
      count = k;
      val += v;
    }
    return val + count.length;
  });
});

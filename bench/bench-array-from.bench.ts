import { bench, describe } from "vitest";

describe("Array.from vs for...of", () => {
  const map = new Map();
  for (let i = 0; i < 20000; i++) {
    map.set(String(i), i);
  }

  bench("Array.from(map.values()) then for loop", () => {
    let count = 0;
    const vals = Array.from(map.values());
    for (let i = 0; i < vals.length; i++) {
      count += vals[i];
    }
    return count;
  });

  bench("for...of map.values()", () => {
    let count = 0;
    for (const val of map.values()) {
      count += val;
    }
    return count;
  });

  bench("for...of map.values() + pre-allocated array", () => {
    let count = 0;
    const vals = new Array(map.size);
    let i = 0;
    for (const val of map.values()) {
      vals[i++] = val;
    }
    for (let j = 0; j < vals.length; j++) {
      count += vals[j];
    }
    return count;
  });
});

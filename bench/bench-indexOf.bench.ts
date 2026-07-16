import { bench, describe } from "vitest";

const list = Array.from({ length: 10000 }, (_, i) => `e${i}`);
const target = "e9999";

describe("indexOf vs binarySearch", () => {
  bench("indexOf", () => {
    list.indexOf(target);
  });

  bench("binarySearch", () => {
    let left = 0;
    let right = list.length - 1;
    while (left <= right) {
      const mid = (left + right) >> 1;
      if (list[mid] === target) break;
      if (list[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
  });
});

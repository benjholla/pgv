import { bench, describe } from "vitest";

describe("Array iteration", () => {
  const arr = Array.from({ length: 10000 }, (_, i) => String(i));

  bench("forEach", () => {
    let count = 0;
    arr.forEach((item, index) => {
      count += item.length + index;
    });
    return count;
  });

  bench("for loop", () => {
    let count = 0;
    for (let index = 0; index < arr.length; index++) {
      count += arr[index].length + index;
    }
    return count;
  });
});

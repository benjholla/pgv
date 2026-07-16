import { bench, describe } from "vitest";

function binarySearch(arr: readonly string[], target: string): number {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const list10 = Array.from({ length: 10 }, (_, i) => `e${i.toString().padStart(3, '0')}`);
const list100 = Array.from({ length: 100 }, (_, i) => `e${i.toString().padStart(3, '0')}`);
const list1000 = Array.from({ length: 1000 }, (_, i) => `e${i.toString().padStart(3, '0')}`);

describe("indexOf vs binarySearch", () => {
  bench("indexOf 10", () => {
    list10.indexOf("e005");
  });
  bench("binarySearch 10", () => {
    binarySearch(list10, "e005");
  });

  bench("indexOf 100", () => {
    list100.indexOf("e050");
  });
  bench("binarySearch 100", () => {
    binarySearch(list100, "e050");
  });

  bench("indexOf 1000", () => {
    list1000.indexOf("e500");
  });
  bench("binarySearch 1000", () => {
    binarySearch(list1000, "e500");
  });
});

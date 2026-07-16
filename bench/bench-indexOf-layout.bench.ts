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

const n = 1000;
const targetIdx = 500;
const list = Array.from({ length: n }, (_, i) => `e${i.toString().padStart(5, '0')}`);
const target = `e${targetIdx.toString().padStart(5, '0')}`;

describe(`indexOf vs binarySearch (n=${n})`, () => {
  bench("indexOf", () => {
    list.indexOf(target);
  });
  bench("binarySearch", () => {
    binarySearch(list, target);
  });
});

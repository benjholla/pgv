import { bench, describe } from "vitest";

function method1(arr: {f: number}[]) {
  arr.sort((a, b) => b.f - a.f);
  return arr.pop();
}

function method2(arr: {f: number}[]) {
  let minIdx = 0;
  let minF = arr[0].f;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].f < minF) {
      minF = arr[i].f;
      minIdx = i;
    }
  }
  const last = arr.length - 1;
  const temp = arr[minIdx];
  arr[minIdx] = arr[last];
  arr[last] = temp;
  return arr.pop();
}

describe("astar min find", () => {
  bench("sort", () => {
    const arr = Array.from({length: 100}, () => ({f: Math.random()}));
    while (arr.length > 0) {
      method1(arr);
    }
  });
  bench("scan", () => {
    const arr = Array.from({length: 100}, () => ({f: Math.random()}));
    while (arr.length > 0) {
      method2(arr);
    }
  });
});

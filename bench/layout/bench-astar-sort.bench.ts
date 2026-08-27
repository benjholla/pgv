import { bench, describe } from "vitest";

class MinHeap {
  heap: {f: number}[];

  constructor() {
    this.heap = [];
  }

  get length(): number {
    return this.heap.length;
  }

  push(node: {f: number}): void {
    this.heap.push(node);
    this.siftUp(this.heap.length - 1);
  }

  pop(): {f: number} | undefined {
    if (this.heap.length === 0) return undefined;
    const first = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return first;
  }

  private siftUp(idx: number): void {
    const node = this.heap[idx];
    while (idx > 0) {
      const parentIdx = (idx - 1) >>> 1;
      const parent = this.heap[parentIdx];
      if (node.f >= parent.f) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = node;
  }

  private siftDown(idx: number): void {
    const length = this.heap.length;
    const node = this.heap[idx];
    while (true) {
      const leftIdx = (idx << 1) + 1;
      const rightIdx = leftIdx + 1;
      let minIdx = idx;
      let minF = node.f;

      if (leftIdx < length && this.heap[leftIdx].f < minF) {
        minIdx = leftIdx;
        minF = this.heap[leftIdx].f;
      }
      if (rightIdx < length && this.heap[rightIdx].f < minF) {
        minIdx = rightIdx;
      }
      if (minIdx === idx) break;

      this.heap[idx] = this.heap[minIdx];
      idx = minIdx;
    }
    this.heap[idx] = node;
  }
}

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
  bench("minheap", () => {
    const heap = new MinHeap();
    const items = Array.from({length: 100}, () => ({f: Math.random()}));
    for (const item of items) {
      heap.push(item);
    }
    while (heap.length > 0) {
      heap.pop();
    }
  });
});

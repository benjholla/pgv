import { bench, describe } from "vitest";

class MinHeap {
  private data: any[];
  constructor() {
    this.data = [];
  }
  push(val: any) {
    this.data.push(val);
    this.bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return undefined;
    if (this.data.length === 1) return this.data.pop();
    const top = this.data[0];
    this.data[0] = this.data.pop();
    this.sinkDown(0);
    return top;
  }
  private bubbleUp(index: number) {
    while (index > 0) {
      let parentIndex = (index - 1) >> 1;
      if (this.data[parentIndex].f <= this.data[index].f) break;
      let temp = this.data[parentIndex];
      this.data[parentIndex] = this.data[index];
      this.data[index] = temp;
      index = parentIndex;
    }
  }
  private sinkDown(index: number) {
    let length = this.data.length;
    while (true) {
      let left = (index << 1) + 1;
      let right = left + 1;
      let smallest = index;

      if (left < length && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < length && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest === index) break;

      let temp = this.data[index];
      this.data[index] = this.data[smallest];
      this.data[smallest] = temp;
      index = smallest;
    }
  }
  get length() {
    return this.data.length;
  }
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

describe("astar min find with MinHeap", () => {
  bench("MinHeap", () => {
    const heap = new MinHeap();
    for (let i=0; i<100; i++) {
       heap.push({f: Math.random()});
    }
    while (heap.length > 0) {
      heap.pop();
    }
  });
  bench("scan array", () => {
    const arr: any[] = [];
    for(let i = 0; i<100; i++) {
        arr.push({f: Math.random()});
    }
    while (arr.length > 0) {
      method2(arr);
    }
  });
});

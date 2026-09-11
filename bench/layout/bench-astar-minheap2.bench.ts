import { bench, describe } from "vitest";

type AStarNode = {f: number};

class MinHeap {
  private data: AStarNode[] = [];

  get length() {
    return this.data.length;
  }

  push(node: AStarNode) {
    this.data.push(node);
    let index = this.data.length - 1;
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = this.data[parentIndex];
      if (node.f >= parent.f) break;
      this.data[parentIndex] = node;
      this.data[index] = parent;
      index = parentIndex;
    }
  }

  pop(): AStarNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const bottom = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = bottom;
      let index = 0;
      const length = this.data.length;
      while (true) {
        let leftChildIndex = (index << 1) + 1;
        let rightChildIndex = leftChildIndex + 1;
        let swapIndex = -1;
        let leftChild: AStarNode;

        if (leftChildIndex < length) {
          leftChild = this.data[leftChildIndex];
          if (leftChild.f < bottom.f) {
            swapIndex = leftChildIndex;
          }
        }

        if (rightChildIndex < length) {
          const rightChild = this.data[rightChildIndex];
          if (
            (swapIndex === -1 && rightChild.f < bottom.f) ||
            (swapIndex !== -1 && rightChild.f < leftChild!.f)
          ) {
            swapIndex = rightChildIndex;
          }
        }

        if (swapIndex === -1) break;

        this.data[index] = this.data[swapIndex];
        this.data[swapIndex] = bottom;
        index = swapIndex;
      }
    }
    return top;
  }
}

function methodScan(arr: AStarNode[]) {
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

describe("astar min find mixed workload (push and pop)", () => {
  bench("minheap", () => {
    const heap = new MinHeap();
    for (let i = 0; i < 50; i++) heap.push({f: Math.random()}); // Initial nodes

    for (let step = 0; step < 500; step++) {
        const current = heap.pop();
        if (!current) break;
        // simulate adding 0-3 neighbours
        const numNeighbors = Math.floor(Math.random() * 4);
        for(let j = 0; j < numNeighbors; j++) {
            heap.push({f: current.f + Math.random()});
        }
    }
  });
  bench("scan", () => {
    const arr: AStarNode[] = [];
    for (let i = 0; i < 50; i++) arr.push({f: Math.random()}); // Initial nodes

    for (let step = 0; step < 500; step++) {
        const current = methodScan(arr);
        if (!current) break;
        // simulate adding 0-3 neighbours
        const numNeighbors = Math.floor(Math.random() * 4);
        for(let j = 0; j < numNeighbors; j++) {
            arr.push({f: current.f + Math.random()});
        }
    }
  });
});

import { bench, describe } from "vitest";

// Simulation of getIdx inside A* routeEdgeOrthogonal
// xCoords and yCoords are constructed from all nodes positions (N * 5 items).
// Let's create an array of 500 sorted numbers (representing 100 obstacles * 5 coords each)
const coords = Array.from({length: 500}, (_, i) => i * 15);

function getIdxScan(arr: number[], val: number) {
  let minIdx = 0;
  let minD = Math.abs(arr[0] - val);
  for (let i = 1; i < arr.length; i++) {
      const d = Math.abs(arr[i] - val);
      if (d < minD) {
          minD = d;
          minIdx = i;
      }
  }
  return minIdx;
}

function getIdxBinarySearch(arr: number[], val: number) {
  let low = 0;
  let high = arr.length - 1;

  if (val <= arr[0]) return 0;
  if (val >= arr[high]) return high;

  while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = arr[mid];

      if (midVal === val) return mid;

      if (midVal < val) {
          low = mid + 1;
      } else {
          high = mid - 1;
      }
  }

  const dHigh = val - arr[high];
  const dLow = arr[low] - val;

  return dHigh <= dLow ? high : low;
}

describe("getIdx in routeEdgeOrthogonal", () => {
  bench("scan", () => {
    // Calling it 4 times for startX, startY, endX, endY
    getIdxScan(coords, 255);
    getIdxScan(coords, 1024);
    getIdxScan(coords, 3050);
    getIdxScan(coords, 6000);
  });
  bench("binary search", () => {
    getIdxBinarySearch(coords, 255);
    getIdxBinarySearch(coords, 1024);
    getIdxBinarySearch(coords, 3050);
    getIdxBinarySearch(coords, 6000);
  });
});

import { bench, describe } from "vitest";

function getIdx1(arr: number[], val: number) {
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

// Since arr is sorted, we can use binary search
function getIdx2(arr: number[], val: number) {
    let low = 0;
    let high = arr.length - 1;

    // Fast path: val is out of bounds
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

    // Now low > high, meaning val is between arr[high] and arr[low]
    const dHigh = val - arr[high]; // val is greater than arr[high]
    const dLow = arr[low] - val; // val is less than arr[low]

    return dHigh <= dLow ? high : low;
}

describe("getIdx scan vs binary search", () => {
    const arr = Array.from({length: 100}, (_, i) => i * 10);
    bench("scan", () => {
        getIdx1(arr, 505);
    });
    bench("binary", () => {
        getIdx2(arr, 505);
    });
});

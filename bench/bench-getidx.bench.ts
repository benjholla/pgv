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
    let minIdx = 0;
    let minD = Math.abs(arr[0] - val);

    while (low <= high) {
        const mid = (low + high) >>> 1;
        const d = Math.abs(arr[mid] - val);
        if (d < minD) {
            minD = d;
            minIdx = mid;
        }

        if (arr[mid] === val) return mid;
        if (arr[mid] < val) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return minIdx;
}

describe("getIdx scan vs binary search", () => {
    const arr = Array.from({length: 1000}, (_, i) => i * 10);
    bench("scan", () => {
        getIdx1(arr, 5005);
    });
    bench("binary", () => {
        getIdx2(arr, 5005);
    });
});

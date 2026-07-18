const fs = require('fs');
let code = fs.readFileSync('src/layout.ts', 'utf8');

const oldCode = `  const getIdx = (arr: number[], val: number) => {
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
  };`;

const newCode = `  // PERF(Bolt): Replaced O(N) scan with O(log N) binary search since coordinate arrays are sorted
  const getIdx = (arr: number[], val: number) => {
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
  };`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/layout.ts', code, 'utf8');

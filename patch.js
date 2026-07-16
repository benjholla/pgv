const fs = require('fs');
let code = fs.readFileSync('src/layout.ts', 'utf8');
code = `function binarySearch(arr: readonly string[], target: string): number {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}\n` + code;
fs.writeFileSync('src/layout.ts', code);

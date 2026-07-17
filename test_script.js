function binarySearch(arr, target) {
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

const arr = ["a", "b", "c", "d"];
console.log(binarySearch(arr, "c"));
console.log(binarySearch(arr, "e"));

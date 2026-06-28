## 2024-06-27 - [Spread operator inside Math.max can cause Maximum call stack size exceeded on large graphs]
**Learning:** In frontend JS graphs, using `Math.max(...Iterable)` can throw a "Maximum call stack size exceeded" error if the iterable has > 100,000 elements because the spread operator passes each item as an individual argument to the function. This breaks layout algorithms on very large graphs.
**Action:** Replace `Math.max(...iterable)` with a manual loop to compute the maximum value, which executes faster, prevents memory spikes, and avoids call stack overflow errors.

import { bench, describe } from "vitest";

const n = 10000;
const containment = ["parent", "contains", "inside"];
const tagsList = Array.from({ length: n }, (_, i) => [i % 5 === 0 ? "contains" : "related"]);

describe(`containment matching (n=${n})`, () => {
  bench("current .includes (array)", () => {
    let result = 0;
    for(let j = 0; j < n; j++) {
      const tags = tagsList[j];
      let isContainment = false;
      for (let i = 0; i < tags.length; i++) {
        if (containment.includes(tags[i])) {
          isContainment = true;
          break;
        }
      }
      if (isContainment) result++;
    }
    return result;
  });

  bench("optimized .has (Set pre-computed)", () => {
    let result = 0;
    const containmentSet = new Set(containment);
    for(let j = 0; j < n; j++) {
      const tags = tagsList[j];
      let isContainment = false;
      for (let i = 0; i < tags.length; i++) {
        if (containmentSet.has(tags[i])) {
          isContainment = true;
          break;
        }
      }
      if (isContainment) result++;
    }
    return result;
  });
});

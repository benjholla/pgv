import { bench, describe } from "vitest";
import { findClosestCoordinateIndex } from "../../src/layout.js";

const coords = Array.from({ length: 1000 }, (_, i) => i * 10.5);

describe("findClosestCoordinateIndex", () => {
  bench("current", () => {
    findClosestCoordinateIndex(coords, 500.5);
    findClosestCoordinateIndex(coords, 10.5);
    findClosestCoordinateIndex(coords, 9990.5);
  });
});

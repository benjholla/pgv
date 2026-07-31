import { bench, describe } from "vitest";

describe("Object.keys vs for...in for model validation", () => {
  const value = { integer: 123 };

  bench("Object.keys(value)", () => {
    let isValid = false;
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const innerKey = keys[0];
      if (innerKey === "integer" && typeof (value as any).integer === "number") isValid = true;
    }
  });

  bench("for...in loop", () => {
    let isValid = false;
    let keyCount = 0;
    let innerKey = undefined;
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        keyCount++;
        innerKey = k;
      }
    }
    if (keyCount === 1) {
      if (innerKey === "integer" && typeof (value as any).integer === "number") isValid = true;
    }
  });
});

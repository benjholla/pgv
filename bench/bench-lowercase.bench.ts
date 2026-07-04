import { bench, describe } from "vitest";

const text = "This is some long attribute text in the node data that we might be searching against.";
const queryLower = "node data";

const escapedQ = "node data".replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(escapedQ, 'i');

describe("case-insensitive string search", () => {
  bench("toLowerCase().includes()", () => {
    text.toLowerCase().includes(queryLower);
  });

  bench("RegExp /query/i .test()", () => {
    regex.test(text);
  });
});

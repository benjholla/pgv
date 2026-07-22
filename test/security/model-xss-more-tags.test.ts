import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS various tags", () => {
  it("blocks other dangerous tags besides script", () => {
    expect(sanitizeString("hello <iframe src='x'>")).toBe("hello ");
    expect(sanitizeString("hello <object data='x'>")).toBe("hello ");
    expect(sanitizeString("hello <embed src='x'>")).toBe("hello ");
    expect(sanitizeString("hello <style>body{display:none}</style>")).toBe("hello body{display:none}");
    expect(sanitizeString("hello <link rel='stylesheet' href='x'>")).toBe("hello ");
    expect(sanitizeString("hello <meta http-equiv='refresh' content='0;url=x'>")).toBe("hello ");
    expect(sanitizeString("hello <base href='x'>")).toBe("hello ");
    expect(sanitizeString("hello <form action='x'>")).toBe("hello ");
    expect(sanitizeString("hello <math>")).toBe("hello ");
  });
});

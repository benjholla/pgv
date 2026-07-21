import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS DEL bypass", () => {
  it("blocks javascript URIs when obfuscated using DEL (\\x7F)", () => {
    expect(sanitizeString("java\x7Fscript:alert(1)")).toBe("#blocked-uri");
  });
});

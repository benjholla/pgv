import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS colon bypass", () => {
  it("blocks javascript URIs when obfuscated using &colon without semicolon", () => {
    // The browser will decode &colon to : because it's not followed by alphanumeric
    const input = "javascript&colon(alert)";
    const result = sanitizeString(input);
    expect(result).toBe("#blocked-uri");
  });
});

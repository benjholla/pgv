import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString with zero-padded hex equals", () => {
  it("blocks inline event handler with zero-padded hex equals", () => {
    const input = `<img src="x" onerror&#x0003d;alert(1)>`;
    const sanitized = sanitizeString(input);
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).toContain("data-blocked");
  });
});

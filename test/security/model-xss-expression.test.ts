import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS CSS expression bypass", () => {
  it("blocks CSS expressions obfuscated with control characters", () => {
    // Basic test
    expect(sanitizeString("style=\"width: expression(alert(1))\"")).toBe('style="width: blocked-expr(alert(1))"');

    // Null byte injection bypass
    expect(sanitizeString("style=\"width: e\x00xpression(alert(1))\"")).toBe('style="width: blocked-expr(alert(1))"');
    expect(sanitizeString("style=\"width: ex\x00pression(alert(1))\"")).toBe('style="width: blocked-expr(alert(1))"');
    expect(sanitizeString("style=\"width: exp\x00ression(alert(1))\"")).toBe('style="width: blocked-expr(alert(1))"');

    // Test tabs/newlines and other whitespace variations
    expect(sanitizeString("style=\"width: e\x09xpression(alert(1))\"")).toBe('style="width: blocked-expr(alert(1))"');
    expect(sanitizeString("style=\"width: e\x0Axpression(alert(1))\"")).toBe('style="width: blocked-expr(alert(1))"');
  });
});

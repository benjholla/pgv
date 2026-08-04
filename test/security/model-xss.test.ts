import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS named entities bypass", () => {
  it("blocks javascript URIs when obfuscated using named entities", () => {
    expect(sanitizeString("javascript&colon;alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java&Tab;script&colon;alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("javascript&NewLine;&colon;alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("JaVaScRiPt&CoLoN;alert(1)")).toBe("#blocked-uri");
  });

  it("blocks javascript URIs when obfuscated using mutation XSS (tag stripping)", () => {
    expect(sanitizeString("javascr<script>ipt:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java<script>script&colon;alert(1)")).toBe("#blocked-uri");
  });

  it("blocks javascript URIs when obfuscated using zero-width characters", () => {
    expect(sanitizeString("java\u200Bscript:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java\u200Cscript:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java\u200Dscript:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java\u200Escript:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java\u200Fscript:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java\u202Ascript:alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java\u202Escript:alert(1)")).toBe("#blocked-uri");
  });

  it("permits safe substrings containing dangerous scheme keywords if not in a dangerous context", () => {
    // These should not be blocked because they don't match the regex anchor/context
    expect(sanitizeString("I love javascript: it is great")).toBe("I love javascript: it is great");
    expect(sanitizeString("Some text =\"javascript: destroyed")).toBe("#blocked-uri");
    // This should be blocked as it starts at the beginning
    expect(sanitizeString("javascript:alert(1)")).toBe("#blocked-uri");
    // This should be blocked as it follows an attribute wrapper
    expect(sanitizeString('href="javascript:alert(1)"')).toBe("#blocked-uri");
  });

  it("blocks javascript URIs using backticks as attribute wrapper", () => {
    expect(sanitizeString("<a href=`javascript:alert(1)`>Click me</a>")).toBe("#blocked-uri");
  });

  it("handles anchor tags with missing rel attribute but target _blank", () => {
    const input = '<a target="_blank">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a target="_blank" rel="noopener noreferrer">Link</a>');
  });

  it("handles anchor tags where target does not have a value", () => {
    const input = '<a target rel="opener">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a target rel="opener">Link</a>');
  });

  it("handles anchor tags where target has a safe value", () => {
    const input = '<a target="_self" rel="opener">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a target="_self" rel="opener">Link</a>');
  });
});

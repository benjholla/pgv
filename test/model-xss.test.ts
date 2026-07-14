import { describe, it, expect } from "vitest";
import { sanitizeString } from "../src/model";

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
});

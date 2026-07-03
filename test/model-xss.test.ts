import { describe, it, expect } from "vitest";
import { sanitizeString } from "../src/model";

describe("sanitizeString XSS named entities bypass", () => {
  it("blocks javascript URIs when obfuscated using named entities", () => {
    expect(sanitizeString("javascript&colon;alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("java&Tab;script&colon;alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("javascript&NewLine;&colon;alert(1)")).toBe("#blocked-uri");
    expect(sanitizeString("JaVaScRiPt&CoLoN;alert(1)")).toBe("#blocked-uri");
  });
});

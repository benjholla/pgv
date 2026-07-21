import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString unclosed script tags", () => {
  it("blocks unclosed script tags which might bypass filtering", () => {
    // Should remove the unclosed tag entirely.
    expect(sanitizeString("<script src='malicious'")).toBe("");
    expect(sanitizeString("hello <script src='malicious'")).toBe("hello ");
  });
});

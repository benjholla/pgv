import { describe, it, expect } from "vitest";
import { decodeHtmlEntities } from "../../src/model";

describe("decodeHtmlEntities", () => {
  it("decodes equals", () => {
    expect(decodeHtmlEntities("&equals;")).toBe("=");
    expect(decodeHtmlEntities("&#x3d;")).toBe("=");
    expect(decodeHtmlEntities("&#61;")).toBe("=");
    expect(decodeHtmlEntities("&#x0003d;")).toBe("=");
    expect(decodeHtmlEntities("&#00061;")).toBe("=");
  });
});

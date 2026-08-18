import { describe, it, expect } from "vitest";
import { sanitizeString, decodeHtmlEntities } from "../../src/model";

describe("sanitizeString XSS named entities for equals sign bypass", () => {
  it("blocks inline event handlers with obfuscated equals sign", () => {
    expect(sanitizeString("<img src=x onerror&equals;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
    expect(sanitizeString("<img src=x onerror&#x3d;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
    expect(sanitizeString("<img src=x onerror&#61;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
  });

  it("decodeHtmlEntities correctly decodes equals sign entities", () => {
    expect(decodeHtmlEntities("&equals;")).toBe("=");
    expect(decodeHtmlEntities("&#x3d;")).toBe("=");
    expect(decodeHtmlEntities("&#61;")).toBe("=");
  });
});

import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS equals bypass", () => {
  it("blocks inline event handlers obfuscated with encoded equals", () => {
    expect(sanitizeString("<img src=x onerror&equals;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
    expect(sanitizeString("<img src=x onerror&#x3d;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
    expect(sanitizeString("<img src=x onerror&#61;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
  });
});

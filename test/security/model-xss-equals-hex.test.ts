import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS equals hex bypass", () => {
  it("blocks inline event handlers obfuscated with padded hex encoded equals", () => {
    expect(sanitizeString("<img src=x onerror&#x03d;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
    expect(sanitizeString("<img src=x onerror&#x003d;alert(1)>")).toBe('<img src=x data-blocked=alert(1)>');
  });
});

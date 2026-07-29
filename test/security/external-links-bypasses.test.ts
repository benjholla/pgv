import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString external links protection - bypasses", () => {
  it("handles early regex termination bypass (<a title=\">\" target=\"_blank\">)", () => {
    const input = '<a title=">" target="_blank" rel="opener">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a title=">" target="_blank" rel="opener noopener noreferrer">Link</a>');
  });

  it("handles duplicate attribute bypass (browser ignores second rel)", () => {
    const input = '<a target="_blank" rel="opener" rel="x">Link</a>';
    const result = sanitizeString(input);
    // DOMParser merges duplicate attributes or drops the second one, rendering standard HTML.
    expect(result).toBe('<a target="_blank" rel="opener noopener noreferrer" rel="x">Link</a>');
  });

  it("handles target keyword bypass with spaces", () => {
    const input = '<a target=" _blank">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a target=" _blank" rel="noopener noreferrer">Link</a>');
  });

  it("handles custom browsing context targets", () => {
    const input = '<a target="custom_window">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a target="custom_window" rel="noopener noreferrer">Link</a>');
  });
});

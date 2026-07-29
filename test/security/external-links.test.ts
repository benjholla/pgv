import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString external links protection", () => {
  it("adds rel=\"noopener noreferrer\" to links with target=\"_blank\"", () => {
    const input = '<a href="http://evil.com" target="_blank">Click me</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="http://evil.com" target="_blank" rel="noopener noreferrer">Click me</a>');
  });

  it("updates existing rel attribute to include noopener noreferrer", () => {
    const input = '<a href="a" target="_blank" rel="author">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="a" target="_blank" rel="author noopener noreferrer">Link</a>');
  });

  it("does not modify if rel noopener already exists", () => {
    const input = '<a href="a" target="_blank" rel="noopener noreferrer">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="a" target="_blank" rel="noopener noreferrer">Link</a>');
  });

  it("does not modify links without target=\"_blank\"", () => {
    const input = '<a href="http://evil.com">Click me</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="http://evil.com">Click me</a>');
  });

  it("handles unquoted target attribute and wraps rel in quotes", () => {
    const input = '<a href="a" target=_blank rel=author>Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="a" target=_blank rel="author noopener noreferrer">Link</a>');
  });

  it("handles multi-value rel attributes correctly", () => {
    const input = '<a href="a" target="_blank" rel="author nofollow">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="a" target="_blank" rel="author nofollow noopener noreferrer">Link</a>');
  });

  it("does not false positive when another attribute contains noopener", () => {
    const input = '<a href="a" target="_blank" rel="author" class="noopener">Link</a>';
    const result = sanitizeString(input);
    expect(result).toBe('<a href="a" target="_blank" rel="author noopener noreferrer" class="noopener">Link</a>');
  });
});

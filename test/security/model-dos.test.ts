import { describe, it, expect } from "vitest";
import { createGraphSnapshot, sanitizeString } from "../../src/model";

describe("DoS prevention via input length limits", () => {
  it("rejects excessively long strings in node IDs", () => {
    const longString = "a".repeat(100_001);

    expect(() => createGraphSnapshot({
      graphId: "test-dos",
      version: 1,
      nodes: [{ id: longString }],
      edges: []
    })).toThrow(/exceeds maximum allowed length/);
  });

  it("rejects excessively long strings in attribute keys", () => {
    const longString = "a".repeat(100_001);

    expect(() => createGraphSnapshot({
      graphId: "test-dos",
      version: 1,
      nodes: [{ id: "n1", attributes: { [longString]: "value" } }],
      edges: []
    })).toThrow(/exceeds maximum allowed length/);
  });

  it("rejects excessively long strings in attribute values", () => {
    const longString = "a".repeat(100_001);

    expect(() => createGraphSnapshot({
      graphId: "test-dos",
      version: 1,
      nodes: [{ id: "n1", attributes: { key: longString } }],
      edges: []
    })).toThrow(/exceeds maximum allowed length/);
  });

  it("rejects excessively long strings when calling sanitizeString directly", () => {
    const longString = "a".repeat(100_001);

    expect(() => sanitizeString(longString)).toThrow(/exceeds maximum allowed length/);
  });

  it("rejects excessively nested script tags exceeding iteration limit", () => {
    let str = "<script>";
    for (let i = 0; i < 55; i++) {
      str = `<scr${str}ipt>`;
    }
    expect(() => sanitizeString(str)).toThrow(/too complex to sanitize safely/);
  });

  it("rejects excessively nested URL encodings exceeding iteration limit", () => {
    const str = "%" + "25".repeat(55) + "3C";
    expect(() => sanitizeString(str)).toThrow(/too complex to sanitize safely/);
  });
});

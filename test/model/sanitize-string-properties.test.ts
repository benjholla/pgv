import { describe, it, expect } from "vitest";
import { sanitizeString, GraphModelError } from "../../src/model";

describe("sanitizeString Properties", () => {
    it("Idempotence Property: sanitize(sanitize(x)) === sanitize(x)", () => {
        const payload = "<script>alert(1)</script><a href='#' onclick='alert(1)'>click</a><div style='expression(alert(1))'></div>";
        const once = sanitizeString(payload);
        const twice = sanitizeString(once);
        expect(once).toBe(twice);
    });

    it("Length Limit Property: Rejects strings exceeding the maximum length", () => {
        const validString = "A".repeat(100_000);
        expect(() => sanitizeString(validString)).not.toThrow();

        const invalidString = "A".repeat(100_001);
        expect(() => sanitizeString(invalidString)).toThrow(GraphModelError);
        expect(() => sanitizeString(invalidString)).toThrow(/maximum allowed length/i);
    });

    it("Noopener/Noreferrer Property: Ensures all links have rel='noopener noreferrer'", () => {
        const noTargetBlank = "<a href='https://example.com'>link</a>";
        expect(sanitizeString(noTargetBlank)).toBe(noTargetBlank);

        const targetBlankNoRel = "<a href='https://example.com' target='_blank'>link</a>";
        expect(sanitizeString(targetBlankNoRel)).toBe("<a href='https://example.com' target='_blank' rel=\"noopener noreferrer\">link</a>");

        const targetBlankWithRel = "<a href='https://example.com' target='_blank' rel='noopener'>link</a>";
        expect(sanitizeString(targetBlankWithRel)).toBe("<a href='https://example.com' target='_blank' rel=\"noopener noreferrer\">link</a>");

        const targetBlankWithOtherRel = "<a href='https://example.com' target='_blank' rel='author'>link</a>";
        expect(sanitizeString(targetBlankWithOtherRel)).toBe("<a href='https://example.com' target='_blank' rel=\"author noopener noreferrer\">link</a>");
    });

    it("Appends rel correctly to self-closing link tags", () => {
        const selfClosing = "<a href='https://example.com' target='_blank'/>";
        expect(sanitizeString(selfClosing)).toBe("<a href='https://example.com' target='_blank' rel=\"noopener noreferrer\"/>");
    });

    it("Does not modify self-closing links without target='_blank'", () => {
        const selfClosing = "<a href='https://example.com'/>";
        expect(sanitizeString(selfClosing)).toBe(selfClosing);
    });
});

import { describe, it, expect } from "vitest";
import { sanitizeString } from "../src/model";

describe("sanitizeString data URIs", () => {
  it("blocks dangerous data URIs", () => {
    expect(sanitizeString("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe("#blocked-uri");
    expect(sanitizeString("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=")).toBe("#blocked-uri");
    expect(sanitizeString("data:text/xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=")).toBe("#blocked-uri");
    expect(sanitizeString("data:application/xhtml+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=")).toBe("#blocked-uri");
  });
});

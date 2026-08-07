import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/model";

describe("sanitizeString XSS various tags", () => {
  it("blocks other dangerous tags besides script", () => {
    expect(sanitizeString("hello <iframe src='x'>")).toBe("hello ");
    expect(sanitizeString("hello <object data='x'>")).toBe("hello ");
    expect(sanitizeString("hello <embed src='x'>")).toBe("hello ");
    expect(sanitizeString("hello <style>body{display:none}</style>")).toBe("hello body{display:none}");
    expect(sanitizeString("hello <link rel='stylesheet' href='x'>")).toBe("hello ");
    expect(sanitizeString("hello <meta http-equiv='refresh' content='0;url=x'>")).toBe("hello ");
    expect(sanitizeString("hello <base href='x'>")).toBe("hello ");
    expect(sanitizeString("hello <form action='x'>")).toBe("hello ");
    expect(sanitizeString("hello <math>")).toBe("hello ");
    expect(sanitizeString("hello <set attributeName='onmouseover' to='alert(1)'></set>")).toBe("hello ");
    expect(sanitizeString("hello <animate attributeName='href' values='javascript:alert(1)'></animate>")).toBe("hello ");
    expect(sanitizeString("hello <applet>")).toBe("hello ");
    expect(sanitizeString("hello <frame>")).toBe("hello ");
    expect(sanitizeString("hello <frameset>")).toBe("hello ");
    expect(sanitizeString("hello <bgsound>")).toBe("hello ");
    expect(sanitizeString("hello <template>")).toBe("hello ");
    expect(sanitizeString("hello <foreignObject>alert(1)</foreignObject>")).toBe("hello alert(1)");
    expect(sanitizeString("hello <animateTransform>")).toBe("hello ");
    expect(sanitizeString("hello <animateMotion>")).toBe("hello ");
    expect(sanitizeString("hello <discard>")).toBe("hello ");
    expect(sanitizeString("hello <audio>")).toBe("hello ");
    expect(sanitizeString("hello <video>")).toBe("hello ");
    expect(sanitizeString("hello <source>")).toBe("hello ");
    expect(sanitizeString("hello <track>")).toBe("hello ");
  });
});

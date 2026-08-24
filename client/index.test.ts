import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(fileURLToPath(new URL("./index.html", import.meta.url)), "utf8");

describe("document accessibility metadata", () => {
  it("keeps the responsive viewport without blocking user zoom", () => {
    expect(indexHtml).toContain('content="width=device-width, initial-scale=1.0"');
    expect(indexHtml).not.toContain("maximum-scale");
    expect(indexHtml).not.toContain("user-scalable=no");
  });
});

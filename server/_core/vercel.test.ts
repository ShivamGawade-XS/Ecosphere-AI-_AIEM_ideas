import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { createApplication } from "./app";

describe("Vercel deployment contract", () => {
  it("constructs the HTTP app without binding a local listener", () => {
    const app = createApplication();

    expect(app).toBeTypeOf("function");
    expect(app.get("x-powered-by")).toBe(false);
  });

  it("routes all Vercel requests to the serverless app and includes built client assets", () => {
    const configPath = path.resolve(import.meta.dirname, "../..", "vercel.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      buildCommand: string;
      installCommand: string;
      functions: Record<string, { includeFiles: string; maxDuration: number }>;
      rewrites: Array<{ source: string; destination: string }>;
    };

    expect(config.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(config.buildCommand).toBe("pnpm build");
    expect(config.functions["api/index.mjs"]).toEqual({
      includeFiles: "dist/**",
      maxDuration: 60,
    });
    expect(config.rewrites).toEqual([{ source: "/(.*)", destination: "/api" }]);
  });

  it("exports the built application without starting a listener in Vercel", () => {
    const bootstrapPath = path.resolve(import.meta.dirname, "index.ts");
    const bootstrap = fs.readFileSync(bootstrapPath, "utf8");

    expect(bootstrap).toContain("export default app;");
    expect(bootstrap).toContain("if (!process.env.VERCEL)");
  });
});

import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { createApplication } from "./app";
import { resolveStaticDistPath } from "./static";

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
      outputDirectory: string;
      functions: Record<string, { includeFiles: string; maxDuration: number }>;
      rewrites: Array<{ source: string; destination: string }>;
    };

    expect(config.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(config.buildCommand).toBe("pnpm build");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions["api/index.mjs"]).toEqual({
      includeFiles: "dist/**",
      maxDuration: 60,
    });
    expect(config.rewrites).toEqual([{ source: "/(.*)", destination: "/api" }]);
  });

  it("exports a production application without development Vite imports", () => {
    const bootstrapPath = path.resolve(import.meta.dirname, "serverApp.ts");
    const bootstrap = fs.readFileSync(bootstrapPath, "utf8");

    expect(bootstrap).toContain("export default app;");
    expect(bootstrap).toContain("serveStatic(app);");
    expect(bootstrap).not.toContain("./vite");
  });

  it("keeps the clean Node production-start artifact aligned with the build output", () => {
    const packagePath = path.resolve(import.meta.dirname, "../..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { scripts: Record<string, string> };
    const startPath = path.resolve(import.meta.dirname, "startProduction.ts");
    const start = fs.readFileSync(startPath, "utf8");

    expect(pkg.scripts.build).toContain("dist/server/start.js");
    expect(pkg.scripts.start).toContain("dist/server/start.js");
    expect(start).toContain('import app from "./serverApp"');
  });

  it("resolves the compiled Node server's adjacent public artifact", () => {
    expect(resolveStaticDistPath({
      isVercel: false,
      isDevelopment: false,
      moduleDir: "/workspace/dist/server",
      cwd: "/workspace",
    })).toBe(path.resolve("/workspace/dist/public"));
  });
});

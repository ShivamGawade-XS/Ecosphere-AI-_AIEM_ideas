import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function resolveStaticDistPath(input: {
  isVercel: boolean;
  isDevelopment: boolean;
  moduleDir: string;
  cwd: string;
}) {
  if (input.isVercel) return path.resolve(input.cwd, "dist", "public");
  if (input.isDevelopment) return path.resolve(input.moduleDir, "../..", "dist", "public");
  // The compiled production entry lives in dist/server, adjacent to dist/public.
  return path.resolve(input.moduleDir, "..", "public");
}

/**
 * Serves the built client without loading Vite or its Rollup runtime.
 * Serverless hosts use the artifact copied into `dist` by the build command.
 */
export function serveStatic(app: Express) {
  const distPath = resolveStaticDistPath({
    isVercel: Boolean(process.env.VERCEL),
    isDevelopment: process.env.NODE_ENV === "development",
    moduleDir: import.meta.dirname,
    cwd: process.cwd(),
  });

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

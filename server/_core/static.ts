import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serves the built client without loading Vite or its Rollup runtime.
 * Serverless hosts use the artifact copied into `dist` by the build command.
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.VERCEL
      ? path.resolve(process.cwd(), "dist", "public")
      : process.env.NODE_ENV === "development"
        ? path.resolve(import.meta.dirname, "../..", "dist", "public")
        : path.resolve(import.meta.dirname, "public");

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

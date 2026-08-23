import "dotenv/config";
import { createApplication } from "./app";
import { serveStatic } from "./static";

/**
 * Production HTTP app entry. This excludes development-only Vite imports so
 * Vercel's serverless runtime needs only the compiled app and static assets.
 */
const app = createApplication();
serveStatic(app);

export default app;

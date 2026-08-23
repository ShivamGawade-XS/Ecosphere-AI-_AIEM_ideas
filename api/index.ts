import { createApplication } from "../server/_core/app";
import { serveStatic } from "../server/_core/vite";

const app = createApplication();
serveStatic(app);

/** Vercel Node.js Function configuration; plan limits still apply. */
export const config = { maxDuration: 60 };

export default app;

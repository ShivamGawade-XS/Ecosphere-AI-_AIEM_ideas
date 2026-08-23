// Vercel bundles this thin ESM adapter with the generated server artifact.
// `dist/server/index.js` is produced by the configured `pnpm build` command.
import app from "../dist/server/index.js";

export const config = { maxDuration: 60 };

export default app;

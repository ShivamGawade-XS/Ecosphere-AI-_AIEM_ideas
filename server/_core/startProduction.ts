import { createServer } from "node:http";
import app from "./serverApp";

const configuredPort = Number(process.env.PORT ?? "3000");

if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

createServer(app).listen(configuredPort, () => {
  console.log(`EcoSphere AI production server listening on port ${configuredPort}.`);
});

import type { Express } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

const PUBLIC_STORAGE_KEYS = new Set([
  "ecosphere-field-marker_4829d44d.png",
  "ecosphere-hero-mission-control_79db0674.jpg",
  "ecosphere-campus-signal_5a5a962b.jpg",
  "ecosphere-scenario-table_022e21f9.jpg",
]);

export function isExplicitPublicStorageKey(key: string) {
  return PUBLIC_STORAGE_KEYS.has(key);
}

export function organizationIdFromStorageKey(key: string) {
  const match = /^organizations\/([1-9]\d*)\//.exec(key);
  return match ? Number(match[1]) : undefined;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!isExplicitPublicStorageKey(key)) {
      const organizationId = organizationIdFromStorageKey(key);
      if (!organizationId) {
        res.status(404).send("Storage object not found");
        return;
      }
      try {
        const user = await sdk.authenticateRequest(req);
        if (user.isCron || !(await db.getOrganizationMembership(user.id, organizationId))) {
          res.status(403).send("Storage access denied");
          return;
        }
      } catch {
        res.status(401).send("Authentication required");
        return;
      }
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

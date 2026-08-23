import { describe, expect, it } from "vitest";
import { resolveVercelCron } from "./vercelCron";

describe("Vercel Cron authorization", () => {
  it("remains disabled until both required deployment values exist", () => {
    expect(resolveVercelCron({})).toEqual({ state: "disabled" });
    expect(resolveVercelCron({ cronSecret: "secret" })).toEqual({ state: "misconfigured" });
    expect(resolveVercelCron({ organizationId: "7" })).toEqual({ state: "misconfigured" });
  });

  it("rejects incorrect cron credentials without exposing deployment values", () => {
    expect(
      resolveVercelCron({
        authorization: "Bearer not-the-secret",
        cronSecret: "secret",
        organizationId: "7",
      })
    ).toEqual({ state: "rejected" });
  });

  it("authorizes only a matching secret and safe positive organization id", () => {
    expect(
      resolveVercelCron({
        authorization: "Bearer secret",
        cronSecret: "secret",
        organizationId: "7",
      })
    ).toEqual({ state: "authorized", organizationId: 7 });
  });
});

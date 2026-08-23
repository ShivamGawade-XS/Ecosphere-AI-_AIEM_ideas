import { timingSafeEqual } from "crypto";

export type VercelCronResolution =
  | { state: "disabled" }
  | { state: "misconfigured" }
  | { state: "rejected" }
  | { state: "authorized"; organizationId: number };

function matchesBearerSecret(authorization: string | undefined, secret: string) {
  const actual = Buffer.from(authorization ?? "", "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Resolves an optional Vercel Cron principal. A Vercel deployment can activate
 * this only by configuring both CRON_SECRET and VERCEL_CRON_ORGANIZATION_ID.
 * Partial configuration is treated as unsafe rather than falling through to a
 * different scheduler identity.
 */
export function resolveVercelCron({
  authorization,
  cronSecret,
  organizationId,
}: {
  authorization?: string;
  cronSecret?: string;
  organizationId?: string;
}): VercelCronResolution {
  const attempted = Boolean(cronSecret || organizationId);
  if (!attempted) return { state: "disabled" };

  const parsedOrganizationId = Number(organizationId);
  if (
    !cronSecret ||
    !Number.isSafeInteger(parsedOrganizationId) ||
    parsedOrganizationId <= 0
  ) {
    return { state: "misconfigured" };
  }

  if (!matchesBearerSecret(authorization, cronSecret)) {
    return { state: "rejected" };
  }

  return { state: "authorized", organizationId: parsedOrganizationId };
}

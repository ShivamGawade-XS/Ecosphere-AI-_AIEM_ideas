export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// The managed runtime provides a 22-character URL-safe secret (~132 bits).
// Require at least 16 characters while relying on a cryptographically random secret source.
export const MIN_SESSION_SECRET_LENGTH = 16;

export function hasStrongSessionSecret(secret: string) {
  return secret.trim().length >= MIN_SESSION_SECRET_LENGTH;
}

export function hasAuthenticationConfiguration(input: Pick<typeof ENV, "appId" | "cookieSecret" | "oAuthServerUrl">) {
  return Boolean(input.appId.trim()) && Boolean(input.oAuthServerUrl.trim()) && hasStrongSessionSecret(input.cookieSecret);
}

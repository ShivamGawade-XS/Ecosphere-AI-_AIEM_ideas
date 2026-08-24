import { TRPCClientError } from "@trpc/client";

/** Uses the typed tRPC error contract rather than mutable display text. */
export function isUnauthorizedTrpcError(error: unknown) {
  return error instanceof TRPCClientError && (error.data?.code === "UNAUTHORIZED" || error.data?.httpStatus === 401);
}

/**
 * Prevents several concurrent protected queries from launching repeated OAuth
 * navigations. A navigation normally unloads the page; the guard only needs to
 * coordinate the current client shell.
 */
export function createUnauthorizedRedirectGuard(startLogin: () => void) {
  let redirectStarted = false;
  return (error: unknown) => {
    if (typeof window === "undefined" || redirectStarted || !isUnauthorizedTrpcError(error)) return false;
    redirectStarted = true;
    startLogin();
    return true;
  };
}

import { TRPCClientError } from "@trpc/client";
import { describe, expect, it, vi } from "vitest";
import { createUnauthorizedRedirectGuard, isUnauthorizedTrpcError } from "./authRedirect";

/** @vitest-environment jsdom */
describe("structured unauthorized redirect guard", () => {
  const unauthorized = new TRPCClientError("Any display wording can change", { result: { error: { data: { code: "UNAUTHORIZED", httpStatus: 401 } } } });
  const forbidden = new TRPCClientError("Forbidden", { result: { error: { data: { code: "FORBIDDEN", httpStatus: 403 } } } });

  it("recognizes the typed unauthorized contract without matching presentation text", () => {
    expect(isUnauthorizedTrpcError(unauthorized)).toBe(true);
    expect(isUnauthorizedTrpcError(forbidden)).toBe(false);
    expect(isUnauthorizedTrpcError(new Error("Please login (10001)"))).toBe(false);
  });

  it("redirects only once when several protected queries fail together", () => {
    const startLogin = vi.fn();
    const guard = createUnauthorizedRedirectGuard(startLogin);
    expect(guard(forbidden)).toBe(false);
    expect(guard(unauthorized)).toBe(true);
    expect(guard(unauthorized)).toBe(false);
    expect(startLogin).toHaveBeenCalledTimes(1);
  });
});

/** @vitest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ data: null as { id: number; name: string } | null }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { setData: vi.fn(), invalidate: vi.fn() } } }),
    auth: { me: { useQuery: () => ({ data: authState.data, isLoading: false, error: null }) }, logout: { useMutation: () => ({ isPending: false, error: null, mutateAsync: vi.fn() }) } },
  },
}));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));

import { isSafeUnauthenticatedRedirectPath, useAuth } from "./useAuth";

describe("useAuth profile persistence", () => {
  it("does not write an unauthenticated null profile and only persists a real authenticated identity", () => {
    localStorage.setItem("manus-runtime-user-info", "stale");
    authState.data = null;
    const { rerender } = renderHook(() => useAuth());
    expect(localStorage.getItem("manus-runtime-user-info")).toBeNull();
    authState.data = { id: 17, name: "AIEM Owner" };
    rerender();
    expect(JSON.parse(localStorage.getItem("manus-runtime-user-info") ?? "{}")).toEqual({ id: 17, name: "AIEM Owner" });
  });

  it("accepts only local public redirect destinations and rejects protected or same-page loop targets", () => {
    expect(isSafeUnauthenticatedRedirectPath("/narrative", "/reports")).toBe(true);
    expect(isSafeUnauthenticatedRedirectPath("/", "/reports")).toBe(true);
    expect(isSafeUnauthenticatedRedirectPath("/reports", "/overview")).toBe(false);
    expect(isSafeUnauthenticatedRedirectPath("/narrative", "/narrative")).toBe(false);
    expect(isSafeUnauthenticatedRedirectPath("https://example.com", "/reports")).toBe(false);
  });
});

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

import { useAuth } from "./useAuth";

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
});

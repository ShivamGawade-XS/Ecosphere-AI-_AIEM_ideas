// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ loading: false, user: { name: "AIEM Operator", email: "operator@example.test" }, logout: vi.fn() }),
}));
vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));

import DashboardLayout from "./DashboardLayout";

describe("DashboardLayout operational index", () => {
  beforeEach(() => { window.history.replaceState({}, "", "/app"); localStorage.clear(); });
  afterEach(cleanup);

  it("navigates from the ecosystem index into dedicated product routes", async () => {
    render(<DashboardLayout><div>Workspace body</div></DashboardLayout>);
    expect(screen.getByText("OPERATIONS INDEX")).toBeTruthy();
    fireEvent.click(screen.getByText("Registry"));
    await waitFor(() => expect(window.location.pathname).toBe("/app/registry"));
    fireEvent.click(screen.getByText("Scenarios"));
    await waitFor(() => expect(window.location.pathname).toBe("/app/scenarios"));
    fireEvent.click(screen.getByText("Reports"));
    await waitFor(() => expect(window.location.pathname).toBe("/app/reports"));
  });
});

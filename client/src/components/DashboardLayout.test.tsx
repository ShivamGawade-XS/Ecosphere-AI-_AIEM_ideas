// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ state: { loading: false, user: { name: "AIEM Operator", email: "operator@example.test" } as { name: string; email: string } | null, logout: vi.fn() } }));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => auth.state,
}));
vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));

import DashboardLayout from "./DashboardLayout";

describe("DashboardLayout operational index", () => {
  beforeEach(() => { window.history.replaceState({}, "", "/app"); localStorage.clear(); auth.state = { loading: false, user: { name: "AIEM Operator", email: "operator@example.test" }, logout: vi.fn() }; });
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
    fireEvent.click(screen.getByText("Public narrative"));
    await waitFor(() => expect(window.location.pathname).toBe("/narrative"));
  });

  it("provides a keyboard skip path to the workspace main region", () => {
    render(<DashboardLayout><div>Workspace body</div></DashboardLayout>);

    const skipLink = screen.getByRole("link", { name: "Skip to workspace" });
    expect(skipLink.getAttribute("href")).toBe("#workspace-content");
    expect(document.getElementById("workspace-content")?.getAttribute("tabindex")).toBe("-1");
  });

  it("explains the protected workspace and preserves a public-narrative escape route when signed out", () => {
    auth.state = { loading: false, user: null, logout: vi.fn() };
    render(<DashboardLayout><div>Protected content</div></DashboardLayout>);
    expect(screen.getByRole("heading", { name: "Open the organization evidence ledger." })).toBeTruthy();
    expect(screen.getByText("TENANT EVIDENCE BOUNDARY")).toBeTruthy();
    expect(screen.getByText("Explicitly simulated when enabled")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Authenticate workspace access" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Inspect the public pilot narrative/i }).getAttribute("href")).toBe("/narrative");
  });
});

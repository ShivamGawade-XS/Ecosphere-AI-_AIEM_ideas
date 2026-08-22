// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./components/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main data-testid="operations-shell">{children}</main>,
}));

vi.mock("./pages/Home", () => ({ default: () => <h1>PUBLIC NARRATIVE WORKSPACE</h1> }));
vi.mock("./pages/OperationsOverview", () => ({ default: () => <h1>OPERATIONS OVERVIEW WORKSPACE</h1> }));
vi.mock("./pages/ImplementationDashboard", () => ({ default: () => <h1>READINESS WORKSPACE</h1> }));
vi.mock("./pages/IngestionWorkbench", () => ({ default: () => <h1>LIVE DATA WORKSPACE</h1> }));
vi.mock("./pages/RegistryWorkspace", () => ({ default: () => <h1>REGISTRY WORKSPACE</h1> }));
vi.mock("./pages/IntelligenceWorkspace", () => ({ default: () => <h1>INTELLIGENCE WORKSPACE</h1> }));
vi.mock("./pages/ActionsWorkspace", () => ({ default: () => <h1>ACTIONS WORKSPACE</h1> }));
vi.mock("./pages/ReportsWorkspace", () => ({ default: () => <h1>REPORTS WORKSPACE</h1> }));
vi.mock("./pages/ScenarioWorkspace", () => ({ default: () => <h1>SCENARIOS WORKSPACE</h1> }));

afterEach(() => cleanup());

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("EcoSphere application entry routes", () => {
  it("opens the functional Operations Overview at the root route", async () => {
    renderAt("/");

    expect(await screen.findByRole("heading", { name: "OPERATIONS OVERVIEW WORKSPACE" })).toBeTruthy();
    expect(screen.getByTestId("operations-shell")).toBeTruthy();
  });

  it("keeps the Field Operations Ledger narrative on its dedicated public route", async () => {
    renderAt("/narrative");

    expect(await screen.findByRole("heading", { name: "PUBLIC NARRATIVE WORKSPACE" })).toBeTruthy();
    expect(screen.queryByTestId("operations-shell")).toBeNull();
  });
});

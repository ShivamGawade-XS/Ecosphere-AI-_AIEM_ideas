/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EcosystemDirectory from "./EcosystemDirectory";

const testApi = vi.hoisted(() => ({ startLogin: vi.fn() }));
vi.mock("@/const", () => ({ startLogin: testApi.startLogin }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("public ecosystem directory", () => {
  it("makes protected workspaces discoverable without exposing tenant data", () => {
    render(<EcosystemDirectory />);

    expect(screen.getByText(/More than a landing page/i)).toBeTruthy();
    expect(screen.getAllByText("Operations Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Live Data").length).toBeGreaterThan(0);
    expect(screen.getByText(/authentication is required before any tenant data/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open protected workspace/i }).getAttribute("href")).toBe("/app");
  });

  it("filters the directory and updates the selected workspace handoff", () => {
    render(<EcosystemDirectory />);
    fireEvent.click(screen.getByRole("tab", { name: "Plan" }));
    expect(screen.getAllByText("Scenarios").length).toBeGreaterThan(0);
    expect(screen.queryByText("Live Data")).toBeNull();
    fireEvent.click(screen.getByText("Scenarios"));
    expect(screen.getByRole("link", { name: /Open protected workspace/i }).getAttribute("href")).toBe("/app/scenarios");
  });

  it("offers explicit authentication from the discovery surface", () => {
    render(<EcosystemDirectory />);
    fireEvent.click(screen.getByRole("button", { name: "Authenticate to open workspaces" }));
    expect(testApi.startLogin).toHaveBeenCalledTimes(1);
  });
});

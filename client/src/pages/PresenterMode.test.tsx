/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PresenterMode from "./PresenterMode";

describe("Presenter Mode", () => {
  it("guides the full evidence story through valid workspaces without claiming external proof", () => {
    render(<PresenterMode />);

    expect(screen.getByRole("region", { name: "Presenter flow" })).toBeTruthy();
    expect(screen.getByText("1. Establish the tenant evidence boundary")).toBeTruthy();
    expect(screen.getByText("6. Export only what the records support")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open Intelligence/i }).getAttribute("href")).toBe("/app/intelligence");
    expect(screen.getByRole("link", { name: /Open Scenarios/i }).getAttribute("href")).toBe("/app/scenarios");
    expect(screen.getByRole("link", { name: /Open Reports/i }).getAttribute("href")).toBe("/app/reports");
    expect(screen.getByText(/remain external validation gates/i)).toBeTruthy();
    expect(screen.getByText(/do not substitute invented state/i)).toBeTruthy();
  });
});

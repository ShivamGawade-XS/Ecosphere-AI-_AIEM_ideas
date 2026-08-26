/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./Home";

describe("public narrative evidence boundary", () => {
  it("describes implemented protected capabilities and sends scenario decisions to the server-authoritative workspace", () => {
    render(<Home />);

    expect(screen.getByText("NO NUMBERS")).toBeTruthy();
    expect(screen.getByText("protected server calculation only")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open the verified Scenario Workspace/i }).getAttribute("href")).toBe("/app/scenarios");
    expect(screen.getByText(/server-side monitoring worker turns validated baseline deviation/i)).toBeTruthy();
    expect(screen.queryByText(/kgCO₂e modeled reduction/i)).toBeNull();
    expect(screen.queryByText(/authoritative server calculations remain tracked work/i)).toBeNull();
  });
});

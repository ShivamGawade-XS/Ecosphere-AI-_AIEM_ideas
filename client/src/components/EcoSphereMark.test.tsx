/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EcoSphereMark from "./EcoSphereMark";

describe("EcoSphereMark", () => {
  it("uses a self-contained accessible vector field marker without a remote image dependency", () => {
    render(<EcoSphereMark />);
    const marker = screen.getByRole("img", { name: "EcoSphere AI field marker" });
    expect(marker.tagName.toLowerCase()).toBe("svg");
    expect(marker.querySelector("path")).toBeTruthy();
    expect(screen.getByLabelText("EcoSphere AI")).toBeTruthy();
  });
});

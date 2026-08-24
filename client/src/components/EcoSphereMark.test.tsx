/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EcoSphereMark from "./EcoSphereMark";

describe("EcoSphereMark", () => {
  it("retains recognizable product identity if the optional brand image cannot load", () => {
    render(<EcoSphereMark />);
    const image = screen.getByAltText("EcoSphere AI field marker");
    fireEvent.error(image);
    expect(screen.queryByAltText("EcoSphere AI field marker")).toBeNull();
    expect(screen.getByText("ES")).toBeTruthy();
    expect(screen.getByLabelText("EcoSphere AI")).toBeTruthy();
  });
});

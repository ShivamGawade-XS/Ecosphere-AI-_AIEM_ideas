// @vitest-environment jsdom
import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { ChartStyle } from "./chart";

describe("ChartStyle", () => {
  it("keeps valid color declarations while dropping unsafe CSS interpolation", () => {
    const { container } = render(
      <ChartStyle
        id={'chart; body { background: red }'}
        config={{
          safeMetric: { color: "oklch(0.62 0.16 145)" },
          'unsafe; body { color: red }': { color: "red; body { display: block }" },
          remoteValue: { color: "url(https://untrusted.example/style.css)" },
        }}
      />
    );

    const style = container.querySelector("style");
    expect(style?.textContent).toContain("--color-safeMetric: oklch(0.62 0.16 145);");
    expect(style?.textContent).not.toContain("display: block");
    expect(style?.textContent).not.toContain("url(");
    expect(style?.textContent).not.toContain("body {");
    expect(style?.textContent).toContain("[data-chart=chart-body-background-red]");
  });

  it("omits the style element when every configured value is unsafe", () => {
    const { container } = render(
      <ChartStyle
        id="chart"
        config={{
          unsafe: { color: "javascript:alert(1)" },
        }}
      />
    );

    expect(container.querySelector("style")).toBeNull();
  });
});

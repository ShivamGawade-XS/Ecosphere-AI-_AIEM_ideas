import { describe, expect, it } from "vitest";
import { sanitizeSpreadsheetCell, serializeSafeCsvRows } from "./csvSafety";

describe("spreadsheet-safe CSV serialization", () => {
  it("prefixes formula-like cells while retaining their literal stored values", () => {
    expect(sanitizeSpreadsheetCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(sanitizeSpreadsheetCell(" +cmd")).toBe("' +cmd");
    expect(sanitizeSpreadsheetCell("ordinary evidence")).toBe("ordinary evidence");
  });

  it("quotes and escapes CSV cells after spreadsheet safety handling", () => {
    expect(serializeSafeCsvRows([["Title", '=HYPERLINK("https://invalid")']])).toBe('"Title","\'=HYPERLINK(""https://invalid"")"');
  });
});

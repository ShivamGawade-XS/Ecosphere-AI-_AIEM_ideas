import { describe, expect, it } from "vitest";
import { previewCsvImport } from "./csvImport";

const meters = [{ id: 1, siteId: 1, meterKey: "hvac-main", canonicalUnit: "kWh" }];
const now = new Date("2026-08-22T00:00:00.000Z");

describe("CSV import preview", () => {
  it("parses quoted records and validates registered canonical meter contracts", () => {
    const preview = previewCsvImport({
      csvText: 'meterKey,observedAt,value,unit\n"hvac-main",2026-08-21T23:00:00.000Z,100.25,kWh',
      meters,
      now,
    });
    expect(preview.validRows).toBe(1);
    expect(preview.rows[0]).toMatchObject({ status: "valid", meterKey: "hvac-main", value: 100.25, unit: "kWh" });
  });

  it("quarantines invalid meter, date, value, and unit evidence without discarding the source row", () => {
    const preview = previewCsvImport({
      csvText: "meterKey,observedAt,value,unit\nunknown,not-a-date,-2,m3",
      meters,
      now,
    });
    expect(preview.validRows).toBe(0);
    expect(preview.rejectedRows).toBe(1);
    expect(preview.rows[0].rawRecord).toEqual({ meterkey: "unknown", observedat: "not-a-date", value: "-2", unit: "m3" });
    expect(preview.rows[0].validationErrors).toHaveLength(3);
  });

  it("rejects duplicate meter/time values inside an import file deterministically", () => {
    const preview = previewCsvImport({
      csvText: "meterKey,observedAt,value,unit\nhvac-main,2026-08-21T23:00:00.000Z,100,kWh\nhvac-main,2026-08-21T23:00:00.000Z,101,kWh",
      meters,
      now,
    });
    expect(preview.rows.map((row) => row.status)).toEqual(["valid", "rejected"]);
    expect(preview.rows[1].validationErrors).toContain("duplicate meter and observedAt value within this file.");
  });
});

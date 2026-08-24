import { describe, expect, it } from "vitest";
import { applyInterventionTemplate, INTERVENTION_TEMPLATES } from "./interventionTemplates";

describe("intervention templates", () => {
  it("updates only intervention assumptions and preserves the user-provided baseline", () => {
    const baseline = { baselineEnergyKwh: 9100, baselineWaterM3: 555, baselineWasteKg: 1111, energyReductionPct: 1, renewableSharePct: 2, waterReductionPct: 3, wasteReductionPct: 4, recyclingPct: 5, investmentInr: 6 };
    const result = applyInterventionTemplate(baseline, INTERVENTION_TEMPLATES.find((template) => template.id === "rooftop-solar")!);
    expect(result).toMatchObject({ baselineEnergyKwh: 9100, baselineWaterM3: 555, baselineWasteKg: 1111, renewableSharePct: 35, investmentInr: 950000 });
  });
});

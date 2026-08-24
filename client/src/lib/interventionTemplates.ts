export type ScenarioTemplateAssumptions = {
  baselineEnergyKwh: number; baselineWaterM3: number; baselineWasteKg: number; energyReductionPct: number;
  renewableSharePct: number; waterReductionPct: number; wasteReductionPct: number; recyclingPct: number; investmentInr: number;
};

export type InterventionTemplate = {
  id: "smart-hvac" | "led-upgrade" | "rooftop-solar" | "water-saving" | "waste-segregation";
  name: string;
  focus: string;
  disclosure: string;
  values: Pick<ScenarioTemplateAssumptions, "energyReductionPct" | "renewableSharePct" | "waterReductionPct" | "wasteReductionPct" | "recyclingPct" | "investmentInr">;
};

export const INTERVENTION_TEMPLATES: InterventionTemplate[] = [
  { id: "smart-hvac", name: "Smart HVAC controls", focus: "Energy controls", values: { energyReductionPct: 15, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 400000 }, disclosure: "Pilot modeled defaults only; validate equipment scope and cost before procurement." },
  { id: "led-upgrade", name: "LED upgrade", focus: "Lighting efficiency", values: { energyReductionPct: 12, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 220000 }, disclosure: "Pilot modeled defaults only; validate fixture counts, tariff, and quote before procurement." },
  { id: "rooftop-solar", name: "Rooftop solar", focus: "Renewable share", values: { energyReductionPct: 0, renewableSharePct: 35, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 950000 }, disclosure: "Pilot modeled defaults only; validate roof survey, generation study, and quote before procurement." },
  { id: "water-saving", name: "Water-saving systems", focus: "Water efficiency", values: { energyReductionPct: 0, renewableSharePct: 0, waterReductionPct: 18, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 260000 }, disclosure: "Pilot modeled defaults only; validate fixture, flow, and installation scope before procurement." },
  { id: "waste-segregation", name: "Waste segregation", focus: "Waste and recycling", values: { energyReductionPct: 0, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 10, recyclingPct: 35, investmentInr: 150000 }, disclosure: "Pilot modeled defaults only; validate waste composition, operations, and vendor scope before procurement." },
];

export function applyInterventionTemplate(current: ScenarioTemplateAssumptions, template: InterventionTemplate): ScenarioTemplateAssumptions {
  return { ...current, ...template.values };
}

import React, { FormEvent, useState } from "react";
import { Calculator, CloudSun, Database, GitCompareArrows, Loader2, Save, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { applyInterventionTemplate, INTERVENTION_TEMPLATES, type ScenarioTemplateAssumptions } from "@/lib/interventionTemplates";

type Assumptions = ScenarioTemplateAssumptions;

const initial: Assumptions = { baselineEnergyKwh: 7200, baselineWaterM3: 480, baselineWasteKg: 980, energyReductionPct: 15, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 400000 };
const formatInr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function ScenarioWorkspace() {
  const utils = trpc.useUtils();
  const tenant = useActiveOrganization();
  const organizationId = tenant.organizationId ?? 0;
  const sites = trpc.sites.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const scenarios = trpc.scenarios.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const comparisons = trpc.comparisons.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const actions = trpc.actions.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const [assumptions, setAssumptions] = useState<Assumptions>(initial);
  const [scenarioName, setScenarioName] = useState("HVAC reduction option");
  const [siteId, setSiteId] = useState<number | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<number[]>([]);
  const preview = trpc.scenarios.preview.useMutation({ onError: () => setNotice("Scenario could not be calculated. Review the values and retry.") });
  const save = trpc.scenarios.save.useMutation({
    onSuccess: async () => { await utils.scenarios.list.invalidate({ organizationId }); setNotice("Scenario saved with its server calculation and assumptions."); },
    onError: () => setNotice("Scenario was not saved. Retry the protected operation."),
  });
  const createComparison = trpc.comparisons.create.useMutation({ onSuccess: async () => { await utils.comparisons.list.invalidate({ organizationId }); setNotice("Comparison snapshot saved with its scenario IDs and transparent rank formula."); }, onError: () => setNotice("Comparison was not saved. Select two tenant-owned scenarios and retry.") });
  const setNumber = (key: keyof Assumptions, value: string) => setAssumptions((current) => ({ ...current, [key]: Number(value) }));

  if (tenant.isLoading || (Boolean(organizationId) && (sites.isLoading || scenarios.isLoading || comparisons.isLoading || actions.isLoading))) return <div className="app-loading-state"><Loader2 className="animate-spin"/> Loading saved calculations…</div>;
  if (tenant.error || sites.error || scenarios.error || comparisons.error || actions.error) return <section className="workspace-error"><span className="ops-eyebrow"><span /> SCENARIO UNAVAILABLE</span><h1>Scenario records could not be loaded.</h1><p>No baseline or saved output is inferred when the protected data query fails.</p><button onClick={() => { void sites.refetch(); void scenarios.refetch(); void comparisons.refetch(); void actions.refetch(); }}>Retry workspace</button></section>;
  if (!tenant.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> SCENARIOS NEED A TENANT</span><h1>Save decisions against a real boundary.</h1><p>Create an organization before calculating and preserving intervention options.</p></section>;
  const result = preview.data?.results;
  const fields: Array<[keyof Assumptions, string, string, number, number]> = [
    ["baselineEnergyKwh", "Baseline energy", "kWh/yr", 0, 999999999], ["baselineWaterM3", "Baseline water", "m³/yr", 0, 999999999], ["baselineWasteKg", "Baseline waste", "kg/yr", 0, 999999999], ["energyReductionPct", "Energy reduction", "%", 0, 100], ["renewableSharePct", "Renewable share", "%", 0, 100], ["waterReductionPct", "Water reduction", "%", 0, 100], ["wasteReductionPct", "Waste reduction", "%", 0, 100], ["recyclingPct", "Recycling", "%", 0, 100], ["investmentInr", "Investment", "INR", 0, 999999999],
  ];

  return <div className="ecosystem-page">
    <header className="workspace-header"><div><span className="ops-eyebrow"><span /> SCENARIOS</span><h1>Model an intervention before you fund it.</h1><p>Inputs and results are calculated on the server using the displayed pilot factor set and can be saved with their full assumptions.</p></div><div className="tenant-badge"><Calculator size={18}/><span>pilot-v1</span><b>Deterministic</b></div></header>
    {notice && <div className="workbench-notice" role="status">{notice}</div>}
    <section className="scenario-layout">
      <form className="scenario-inputs" onSubmit={(event: FormEvent) => { event.preventDefault(); preview.mutate({ organizationId, assumptions }); }}>
        <div className="scenario-inputs__header"><CloudSun size={23}/><div><span className="ops-eyebrow">ASSUMPTION SET</span><h2>Scenario inputs</h2></div></div>
        <div className="compact-list" aria-label="Pilot intervention templates"><div><span>REUSABLE PILOT TEMPLATES</span><small>Applying a template preserves the baselines you entered; it only fills disclosed intervention assumptions.</small><div className="workspace-actions">{INTERVENTION_TEMPLATES.map((template) => <button key={template.id} type="button" onClick={() => { setAssumptions((current) => applyInterventionTemplate(current, template)); setScenarioName(template.name); setNotice(`${template.name} pilot assumptions applied. ${template.disclosure}`); }}>{template.name}</button>)}</div></div></div>
        <input value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} aria-label="Scenario name" required minLength={3}/>
        <select value={siteId ?? ""} onChange={(event) => setSiteId(event.target.value ? Number(event.target.value) : undefined)} aria-label="Scenario site"><option value="">All sites</option>{sites.data?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select><small>Site selection is saved as scenario metadata. The preview uses the explicit baseline values entered below; it does not infer a site baseline.</small>
        <div className="scenario-input-grid">{fields.map(([key, label, unit, min, max]) => <label key={key}><span>{label}<small>{unit}</small></span><input aria-label={label} type="number" min={min} max={max} step="0.1" value={assumptions[key]} onChange={(event) => setNumber(key, event.target.value)} /></label>)}</div>
        <button disabled={preview.isPending}>{preview.isPending ? <Loader2 className="animate-spin"/> : <Calculator/>} Calculate on server</button>
      </form>
      <section className="scenario-result">
        <header><div><span className="ops-eyebrow">SERVER OUTPUT</span><h2>{result ? "Modeled result" : "Awaiting calculation"}</h2></div><Database size={23}/></header>
        {result ? <><div className="carbon-shift"><span>{Math.round(result.baselineCarbonKg).toLocaleString()} kgCO₂e</span><i /> <strong>{Math.round(result.projectedCarbonKg).toLocaleString()} kgCO₂e</strong></div><p><b>{Math.round(result.carbonReductionKg).toLocaleString()} kgCO₂e</b> modeled reduction using saved input values.</p><div className="scenario-result-grid"><div><span>ENERGY</span><b>{Math.round(result.projectedEnergyKwh).toLocaleString()} kWh</b></div><div><span>WATER</span><b>{Math.round(result.projectedWaterM3).toLocaleString()} m³</b></div><div><span>WASTE</span><b>{Math.round(result.projectedWasteKg).toLocaleString()} kg</b></div><div><span>ANNUAL SAVINGS</span><b>{formatInr(result.annualSavingsInr)}</b></div><div><span>PAYBACK</span><b>{result.paybackYears ? `${result.paybackYears.toFixed(1)} yrs` : "—"}</b></div><div><span>3-YEAR ROI</span><b>{result.roiPct === null ? "—" : `${Math.round(result.roiPct)}%`}</b></div></div>{result.sdgImpact ? <section className="scenario-sdg-impact" aria-label="Modeled SDG contribution"><header><span className="ops-eyebrow">MODELED SDG CONTRIBUTION</span><b>{result.sdgImpact.calculationVersion}</b></header><div className="scenario-sdg-impact__grid">{result.sdgImpact.contributions.map((impact) => <article key={impact.sdg}><span>SDG {impact.sdg}</span><b>{impact.title}</b><strong>{Math.round(impact.contributionIndex)}/100</strong><small>{impact.evidence}</small></article>)}</div><p>{result.sdgImpact.disclosure}</p></section> : null}<button type="button" className="save-scenario" onClick={() => save.mutate({ organizationId, siteId, name: scenarioName, assumptions })} disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin"/> : <Save size={16}/>} {save.isPending ? "Saving calculation" : "Save scenario"}</button></> : <div className="scenario-empty"><Calculator size={31}/><p>Submit a transparent input set to calculate a server-owned result. This model uses documented pilot defaults and does not represent a procurement quote or realized savings.</p></div>}
      </section>
    </section>
    <section className="workspace-panel scenario-history"><header><div><span className="ops-eyebrow">SAVED SCENARIOS</span><h2>Decision history</h2></div><ShieldCheck size={22}/></header>{scenarios.data?.length ? <div className="compact-list">{scenarios.data.map((scenario) => { const linkedActions = actions.data?.filter((action) => action.scenarioId === scenario.id) ?? []; return <div key={scenario.id}><label><input type="checkbox" aria-label={`Select ${scenario.name} for comparison`} checked={selectedScenarioIds.includes(scenario.id)} onChange={(event) => setSelectedScenarioIds((current) => event.target.checked ? [...current, scenario.id].slice(-6) : current.filter((id) => id !== scenario.id))} /> Select</label><span>{scenario.name}</span><b>{Math.round(scenario.results.carbonReductionKg).toLocaleString()} kgCO₂e</b><small>{scenario.calculationVersion} · {new Date(scenario.updatedAt).toLocaleString()}</small>{linkedActions.map((action) => <small key={action.id}>Linked action #{action.id}: {action.title} · {action.status}</small>)}</div>; })}</div> : <p>No saved scenario exists for this tenant yet.</p>}<div className="workspace-actions"><button disabled={selectedScenarioIds.length < 2 || createComparison.isPending} onClick={() => createComparison.mutate({ organizationId, name: `Comparison ${new Date().toLocaleDateString()}`, scenarioIds: selectedScenarioIds })}>{createComparison.isPending ? "Ranking scenarios…" : <><GitCompareArrows size={16}/> Compare selected scenarios</>}</button><small>{selectedScenarioIds.length}/6 selected. The rank weights modeled carbon reduction, annual savings, ROI, and annual-savings-to-investment efficiency.</small></div>{comparisons.data?.[0] ? <div className="compact-list"><div><span>Latest comparison · {comparisons.data[0].rankingVersion}</span>{((comparisons.data[0].results as Array<{ rank: number; name: string; score: number; disclosure?: string; scoreComponents?: Array<{ label: string; weightPct: number; contributionPoints: number }> }>)).slice(0, 3).map((item) => <section key={`${item.rank}-${item.name}`}><small>#{item.rank} {item.name} · score {item.score}</small>{item.scoreComponents?.map((component) => <small key={component.label}>{component.label}: {component.contributionPoints.toFixed(2)} / {component.weightPct} weighted points</small>)}{item.disclosure ? <small>{item.disclosure}</small> : null}</section>)}</div></div> : <p>No comparison snapshot exists yet. Save at least two scenarios to rank them.</p>}</section>
  </div>;
}

import React, { useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Building2, CheckCircle2, ClipboardCheck, Database, FileUp, Gauge, Play, Radio, RotateCcw, Settings2, Target, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { utcDateBoundary } from "@/lib/utcDates";

function relativeTime(value: Date | null | undefined) {
  if (!value) return "No reading recorded";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  return minutes < 1 ? "Just now" : `${minutes} min ago`;
}

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default function OperationsOverview() {
  const [, navigate] = useLocation();
  const organization = useActiveOrganization();
  const organizationId = organization.organizationId ?? 0;
  const overviewQuery = trpc.operations.overview.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const readingsQuery = trpc.readings.recent.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const actionsQuery = trpc.actions.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const monitoringQuery = trpc.monitoring.status.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const demoQuery = trpc.demo.status.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const targetAssessmentQuery = trpc.targets.assessment.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const utils = trpc.useUtils();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [targetNotice, setTargetNotice] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<"energy" | "water" | "waste" | "carbon" | "ecoscore">("energy");
  const [targetLabel, setTargetLabel] = useState("Monthly energy ceiling");
  const [targetValue, setTargetValue] = useState("500");
  const [targetStart, setTargetStart] = useState(() => dateInputValue(new Date()));
  const [targetEnd, setTargetEnd] = useState(() => dateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));

  const refreshDemoEvidence = async () => {
    await Promise.all([
      utils.demo.status.invalidate({ organizationId }),
      utils.operations.overview.invalidate({ organizationId }),
      utils.readings.recent.invalidate({ organizationId }),
      utils.monitoring.status.invalidate({ organizationId }),
      utils.analytics.overview.invalidate({ organizationId }),
      utils.intelligence.readiness.invalidate({ organizationId }),
      utils.recommendations.list.invalidate({ organizationId }),
      utils.targets.assessment.invalidate({ organizationId }),
    ]);
  };
  const startDemo = trpc.demo.start.useMutation({ onSuccess: async (result) => { setDemoNotice(`Simulation started: ${result.readingsAccepted} explicitly simulated baseline readings were persisted and evaluated.`); await refreshDemoEvidence(); } });
  const advanceDemo = trpc.demo.advance.useMutation({ onSuccess: async (result) => { setDemoNotice(`Cycle ${result.session.cycle} advanced: ${result.readingsAccepted} simulated readings were evaluated by the server worker.`); await refreshDemoEvidence(); } });
  const injectSpike = trpc.demo.injectHvacSpike.useMutation({ onSuccess: async (result) => { setDemoNotice(`Controlled HVAC spike injected: ${result.readingsAccepted} explicitly simulated reading was evaluated. Review Intelligence for the alert and recommendation evidence.`); await refreshDemoEvidence(); } });
  const resetDemo = trpc.demo.reset.useMutation({ onSuccess: async (result) => { setDemoNotice(`Demo reset: ${result.resetSummary?.supersededReadingCount ?? 0} simulated readings were superseded; non-demo tenant evidence was retained.`); await refreshDemoEvidence(); } });
  const createTarget = trpc.targets.create.useMutation({ onSuccess: async () => { setTargetNotice("Target saved. Attainment and freshness use current accepted tenant evidence only."); await utils.targets.assessment.invalidate({ organizationId }); } });

  if (organization.isLoading) return <div className="app-loading-state"><Activity className="animate-spin" /> Loading workspace…</div>;
  if (organization.error) return <section className="app-error-state" role="alert"><AlertTriangle size={24} /><div><h1>Tenant access is unavailable.</h1><p>Confirm your authenticated session and tenant membership, then refresh the workspace.</p></div></section>;
  if (!organization.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> FIRST OPERATIONAL STEP</span><h1>Start with a tenant boundary.</h1><p>Create your organization, register its first site, and define the meter units that live data must satisfy.</p><button onClick={() => navigate("/app/registry")}>Open registry <ArrowUpRight size={16} /></button></section>;

  const overview = overviewQuery.data;
  const monitoring = monitoringQuery.data;
  const activeActions = actionsQuery.data?.filter((item) => item.status === "in_progress") ?? [];
  const protectedDataUnavailable = overviewQuery.error || readingsQuery.error || actionsQuery.error || monitoringQuery.error || demoQuery.error;
  const demoSession = demoQuery.data?.session;
  const canOperateDemo = ["owner", "manager"].includes(organization.activeOrganization.membership.role);
  const demoBusy = startDemo.isPending || advanceDemo.isPending || injectSpike.isPending || resetDemo.isPending;
  return <div className="ecosystem-page">
    <header className="workspace-header"><div><span className="ops-eyebrow"><span /> OPERATIONS OVERVIEW</span><h1>{organization.activeOrganization.organization.name}</h1><p>One authenticated view of the records that power the sustainability operating loop.</p></div><div className="tenant-badge"><Building2 size={18} /><span>{organization.activeOrganization.membership.role}</span><b>Tenant scoped</b></div></header>
    {protectedDataUnavailable && <div className="workbench-notice" role="alert"><AlertTriangle size={18} /> Some protected operational evidence is unavailable. The overview preserves unknown values instead of inferring an empty tenant state.</div>}
    <section className="overview-metrics" aria-label="Operational tenant metrics">
      <article><Database size={20}/><span>REGISTERED METERS</span><strong>{overview?.meterCount ?? "—"}</strong><small>canonical source boundaries</small></article>
      <article><Radio size={20}/><span>VALIDATED READINGS</span><strong>{overview?.readingCount ?? "—"}</strong><small>{relativeTime(overview?.latestReadingAt)}</small></article>
      <article><ClipboardCheck size={20}/><span>ACTIVE ACTIONS</span><strong>{overview?.activeActionCount ?? "—"}</strong><small>{overview ? `${overview.actionCount} total tracked actions` : "action evidence unavailable"}</small></article>
      <article><Gauge size={20}/><span>ECOSCORE</span><strong>{monitoring?.latestScore?.score ?? "—"}</strong><small>{monitoringQuery.error ? "monitoring status unavailable" : monitoring?.latestRun ? `${monitoring.latestRun.status} · ${monitoring.openAlertCount} open alert${monitoring.openAlertCount === 1 ? "" : "s"}` : "run monitoring to create a score"}</small></article>
    </section>
    <section className="workspace-panel demo-simulation-panel" aria-label="Guided Campus Simulation">
      <header><div><span className="ops-eyebrow">GUIDED CAMPUS SIMULATION</span><h2>Show the monitoring loop with controlled evidence.</h2></div><Play size={22}/></header>
      <p>This creates a tenant-scoped <b>simulated</b> AIEM fixture, invokes the server-owned worker for each bounded step, and never represents the records as live campus telemetry. It does not start an always-on browser loop or a production scheduler.</p>
      {demoNotice ? <p className="workbench-notice" role="status" aria-live="polite">{demoNotice}</p> : null}
      {demoQuery.isLoading ? <p role="status">Loading simulation state…</p> : demoQuery.error ? <p className="form-error" role="alert">Simulation state is unavailable. Refresh this workspace before retrying.</p> : demoSession ? <div className="demo-simulation-panel__state"><span>SESSION #{demoSession.id} · {demoSession.status.replaceAll("_", " ")} · cycle {demoSession.cycle}</span><small>All generated readings are explicitly simulated and reset only affects this session.</small></div> : <div className="demo-simulation-panel__state"><span>NO ACTIVE DEMO SESSION</span><small>Start a new guided fixture when you are ready to demonstrate the full controlled sequence.</small></div>}
      {canOperateDemo ? <div className="workspace-actions">
        {!demoSession || demoSession.status === "reset" ? <button disabled={demoBusy} onClick={() => startDemo.mutate({ organizationId })}>{startDemo.isPending ? "Preparing baseline…" : <><Play size={16}/> Start guided demo</>}</button> : null}
        {demoSession?.status === "running" ? <><button disabled={demoBusy} onClick={() => advanceDemo.mutate({ organizationId })}>{advanceDemo.isPending ? "Advancing cycle…" : <><Activity size={16}/> Advance normal cycle</>}</button><button disabled={demoBusy} onClick={() => injectSpike.mutate({ organizationId })}>{injectSpike.isPending ? "Injecting spike…" : <><Zap size={16}/> Inject HVAC spike</>}</button></> : null}
        {demoSession && demoSession.status !== "reset" ? <button className="workspace-link" disabled={demoBusy} onClick={() => resetDemo.mutate({ organizationId })}>{resetDemo.isPending ? "Resetting demo…" : <><RotateCcw size={16}/> Reset demo</>}</button> : null}
      </div> : <p className="muted">Only tenant owners and managers can create, advance, inject, or reset simulated tenant evidence.</p>}
      {(startDemo.error || advanceDemo.error || injectSpike.error || resetDemo.error) ? <p className="form-error" role="alert">{startDemo.error?.message ?? advanceDemo.error?.message ?? injectSpike.error?.message ?? resetDemo.error?.message}</p> : null}
    </section>
    <section className="workspace-panel target-panel" aria-label="Sustainability targets and freshness">
      <header><div><span className="ops-eyebrow">TARGETS & FRESHNESS</span><h2>Measure progress against a declared operating target.</h2></div><Target size={22}/></header>
      <p>Resource and carbon targets are lower-is-better; EcoScore is higher-is-better. Freshness reflects the latest accepted evidence in the target window, not a claimed live integration.</p>
      {targetNotice ? <p className="workbench-notice" role="status">{targetNotice}</p> : null}
      {targetAssessmentQuery.isLoading ? <p role="status">Assessing target evidence…</p> : targetAssessmentQuery.error ? <p className="form-error" role="alert">Target evidence is unavailable. No attainment status is inferred.</p> : targetAssessmentQuery.data?.length ? <div className="target-panel__grid">{targetAssessmentQuery.data.map((item) => <article key={item.target.id} className={`target-panel__item target-panel__item--${item.assessment.state}`}><span>{item.target.targetType.toUpperCase()} · {item.direction.replace("_", " ")}</span><b>{item.target.label}</b><strong>{item.achievedValue === null ? "—" : `${Number(item.achievedValue).toFixed(1)} / `}{Number(item.target.targetValue).toFixed(1)} {item.target.unit}</strong><small>{item.assessment.state.replaceAll("_", " ")} · {item.assessment.freshness}{item.assessment.ageHours === null ? "" : ` · ${Math.round(item.assessment.ageHours)}h old`}</small></article>)}</div> : <p>No active targets are recorded. Add a time-bounded target before showing attainment in a presentation.</p>}
      {canOperateDemo ? <details className="target-panel__create"><summary>Set a tenant-wide target</summary><form onSubmit={(event) => { event.preventDefault(); createTarget.mutate({ organizationId, targetType, label: targetLabel, targetValue: Number(targetValue), windowStart: utcDateBoundary(targetStart, "start"), windowEnd: utcDateBoundary(targetEnd, "end") }); }}><label>Metric<select aria-label="Target metric" value={targetType} onChange={(event) => setTargetType(event.target.value as typeof targetType)}><option value="energy">Energy (kWh)</option><option value="water">Water (m³)</option><option value="waste">Waste (kg)</option><option value="carbon">Carbon (kgCO2e)</option><option value="ecoscore">EcoScore</option></select></label><label>Label<input aria-label="Target label" value={targetLabel} onChange={(event) => setTargetLabel(event.target.value)} required minLength={3}/></label><label>Value<input aria-label="Target value" type="number" min="0.0001" step="0.1" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} required/></label><label>Window starts<input aria-label="Target window start" type="date" value={targetStart} onChange={(event) => setTargetStart(event.target.value)} required/></label><label>Window ends<input aria-label="Target window end" type="date" value={targetEnd} onChange={(event) => setTargetEnd(event.target.value)} required/></label><button disabled={createTarget.isPending}>{createTarget.isPending ? "Saving target…" : "Save target"}</button></form>{createTarget.error ? <p className="form-error" role="alert">{createTarget.error.message}</p> : null}</details> : <p className="muted">Only tenant owners and managers can set targets. Members can inspect current assessed evidence.</p>}
    </section>
    <section className="overview-grid">
      <article className="workspace-panel"><header><div><span className="ops-eyebrow">NEXT USEFUL STEP</span><h2>{overview?.meterCount ? overview?.readingCount ? monitoring?.latestRun ? "Review monitored sustainability signals." : "Turn verified data into a monitored signal." : "Send the first validated reading." : "Register canonical measurement sources."}</h2></div><Settings2 size={22}/></header><p>{overview?.meterCount ? overview?.readingCount ? monitoring?.latestRun ? "The latest deterministic run has persisted operational evidence. Open Intelligence to inspect its score, quality results, anomalies, and alerts." : "The registry and data foundation are active. Run the deterministic monitoring worker from Intelligence to create inspected signals." : "Your meters are registered. Use Live Data to record a first source-backed measurement." : "Define a site and meter in the Registry before any incoming data can be trusted."}</p><button className="workspace-link" onClick={() => navigate(overview?.meterCount ? overview?.readingCount ? "/app/intelligence" : "/app/data" : "/app/registry")}>Continue the loop <ArrowUpRight size={16}/></button></article>
      <article className="workspace-panel workspace-panel--signal"><header><div><span className="ops-eyebrow">CURRENT DATA EVIDENCE</span><h2>Recent readings</h2></div><FileUp size={22}/></header>{readingsQuery.isLoading ? <p role="status">Loading protected readings…</p> : readingsQuery.error ? <p role="alert">Reading evidence is unavailable. No empty-state conclusion is inferred.</p> : readingsQuery.data?.length ? <div className="compact-list">{readingsQuery.data.slice(0, 4).map(({ reading, meter }) => <div key={reading.id}><span>{meter.displayName}</span><b>{reading.value} {reading.unit}</b><small>{new Date(reading.observedAt).toLocaleString()}</small></div>)}</div> : <p>No readings are stored for this tenant. This is expected until the first validated intake occurs.</p>}<button className="workspace-link" onClick={() => navigate("/app/data")}>Open Live Data <ArrowUpRight size={16}/></button></article>
      <article className="workspace-panel workspace-panel--wide"><header><div><span className="ops-eyebrow">ACCOUNTABLE WORK</span><h2>Actions in motion</h2></div>{monitoring?.openAlertCount ? <AlertTriangle size={22}/> : <CheckCircle2 size={22}/>}</header>{actionsQuery.isLoading ? <p role="status">Loading accountable work…</p> : actionsQuery.error ? <p role="alert">Action evidence is unavailable. No empty-state conclusion is inferred.</p> : activeActions.length ? <div className="action-summary">{activeActions.map((action) => <div key={action.id}><span>{action.priority}</span><b>{action.title}</b><small>{action.expectedCarbonReductionKg ? `${action.expectedCarbonReductionKg} kgCO₂e expected` : "Impact estimate not recorded"}</small></div>)}</div> : <p>{monitoring?.openAlertCount ? `${monitoring.openAlertCount} open monitored alert${monitoring.openAlertCount === 1 ? " requires" : "s require"} accountable review in Intelligence.` : "No action is currently in progress. Add a scoped intervention when a validated signal needs accountable follow-through."}</p>}<button className="workspace-link" onClick={() => navigate(monitoring?.openAlertCount ? "/app/intelligence" : "/app/actions")}>{monitoring?.openAlertCount ? "Review alerts" : "Manage actions"} <ArrowUpRight size={16}/></button></article>
    </section>
  </div>;
}

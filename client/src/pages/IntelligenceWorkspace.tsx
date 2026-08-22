import React from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, CircleDashed, Clock3, Gauge, Radar, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

const stateVisual = { ready: CheckCircle2, waiting: CircleDashed, blocked: CircleDashed, planned: Clock3 };

function formatDate(value: Date | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not yet run";
}

export default function IntelligenceWorkspace() {
  const tenant = useActiveOrganization();
  const organizationId = tenant.organizationId ?? 0;
  const utils = trpc.useUtils();
  const readiness = trpc.intelligence.readiness.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const monitoring = trpc.analytics.overview.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const runOnce = trpc.monitoring.runOnce.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.analytics.overview.invalidate({ organizationId }),
        utils.monitoring.status.invalidate({ organizationId }),
        utils.intelligence.readiness.invalidate({ organizationId }),
      ]);
    },
  });
  const acknowledgeAlert = trpc.alerts.acknowledge.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.analytics.overview.invalidate({ organizationId }),
        utils.monitoring.status.invalidate({ organizationId }),
        utils.intelligence.readiness.invalidate({ organizationId }),
      ]);
    },
  });

  if (tenant.isLoading || readiness.isLoading || monitoring.isLoading) return <div className="app-loading-state"><CircleDashed className="animate-spin"/> Loading monitoring evidence…</div>;
  if (tenant.error || readiness.error || monitoring.error) return <section className="workspace-error"><span className="ops-eyebrow"><span /> EVIDENCE UNAVAILABLE</span><h1>Monitoring evidence could not be loaded.</h1><p>The workspace did not infer a status. Check the connection and retry the protected query.</p><button onClick={() => { void readiness.refetch(); void monitoring.refetch(); }}>Retry evidence query</button></section>;
  if (!tenant.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> INTELLIGENCE REQUIRES EVIDENCE</span><h1>Register the data path first.</h1><p>Create a tenant, register canonical meters, and ingest validated readings before monitoring can run.</p></section>;

  const data = monitoring.data;
  const status = data?.status;
  const score = status?.latestScore;
  const openAlerts = data?.alerts.filter((item) => item.alert.status === "open") ?? [];
  return <div className="ecosystem-page">
    <header className="workspace-header"><div><span className="ops-eyebrow"><span /> INTELLIGENCE</span><h1>Monitor deterministic sustainability signals.</h1><p>Data quality, anomaly evidence, pilot carbon calculations, and EcoScore snapshots are persisted by the server worker. Forecasting and AI-written recommendations remain planned.</p></div><div className="tenant-badge"><BrainCircuit size={18}/><span>Evidence first</span><b>Deterministic</b></div></header>
    <section className="overview-metrics" aria-label="Monitoring health metrics">
      <article><Gauge size={20}/><span>LATEST ECOSCORE</span><strong>{score?.score ?? "—"}</strong><small>{score ? `v${score.calculationVersion}` : "Run monitoring to create a score"}</small></article>
      <article><AlertTriangle size={20}/><span>OPEN ALERTS</span><strong>{status?.openAlertCount ?? 0}</strong><small>{openAlerts.length ? "Acknowledgement required" : "No active alert evidence"}</small></article>
      <article><ShieldCheck size={20}/><span>QUALITY REVIEW</span><strong>{(data?.qualityWarnings ?? 0) + (data?.qualityFailures ?? 0)}</strong><small>{data?.qualityFailures ?? 0} failed · {data?.qualityWarnings ?? 0} warning</small></article>
      <article><Zap size={20}/><span>PILOT CARBON</span><strong>{data?.carbonTotals.totalKgCo2e?.toFixed(1) ?? "0.0"}</strong><small>kgCO₂e from energy readings</small></article>
    </section>
    <section className="overview-grid">
      <article className="workspace-panel"><header><div><span className="ops-eyebrow">WORKER CONTROL</span><h2>Run monitoring once</h2></div><RefreshCw size={22}/></header><p>The control invokes the same browser-independent worker used by the protected scheduled callback. It does not start a browser loop or long-lived client process.</p><p><b>Last run:</b> {formatDate(status?.latestRun?.startedAt)} {status?.latestRun ? `(${status.latestRun.status})` : ""}</p><button className="workspace-link" disabled={runOnce.isPending} onClick={() => runOnce.mutate({ organizationId })}>{runOnce.isPending ? "Running deterministic checks…" : "Run monitoring now"} <RefreshCw size={16} className={runOnce.isPending ? "animate-spin" : ""}/></button>{runOnce.error ? <p role="alert" className="form-error">{runOnce.error.message}</p> : null}{runOnce.data ? <p role="status">Run {runOnce.data.status}: {runOnce.data.readingsScanned} newly evaluated reading{runOnce.data.readingsScanned === 1 ? "" : "s"}, {runOnce.data.anomaliesCreated} anomaly event{runOnce.data.anomaliesCreated === 1 ? "" : "s"}.</p> : null}</article>
      <article className="workspace-panel workspace-panel--signal"><header><div><span className="ops-eyebrow">ALERT LIFECYCLE</span><h2>Recent alerts</h2></div><AlertTriangle size={22}/></header>{data?.alerts.length ? <div className="compact-list">{data.alerts.slice(0, 4).map(({ alert, meter }) => <div key={alert.id}><span>{alert.severity.toUpperCase()} · {meter.displayName}</span><b>{alert.title}</b><small>{alert.status} · {formatDate(alert.createdAt)}</small>{alert.status === "open" ? <button disabled={acknowledgeAlert.isPending} onClick={() => acknowledgeAlert.mutate({ organizationId, alertId: alert.id })}>Acknowledge</button> : null}</div>)}</div> : <p>No monitoring alerts are persisted yet. A medium-or-higher deviation produces an alert after sufficient baseline readings exist.</p>}</article>
      <article className="workspace-panel workspace-panel--wide"><header><div><span className="ops-eyebrow">ANOMALY EVIDENCE</span><h2>Recent deviations</h2></div><Radar size={22}/></header>{data?.anomalies.length ? <div className="action-summary">{data.anomalies.slice(0, 4).map(({ anomaly, meter }) => <div key={anomaly.id}><span>{anomaly.severity}</span><b>{meter.displayName}: z-score {Number(anomaly.zScore).toFixed(2)}</b><small>Observed {anomaly.observedValue}; baseline {anomaly.baselineMean}; status {anomaly.status}</small></div>)}</div> : <p>No anomaly events are persisted. The detector requires three prior eligible readings for each meter and uses a transparent rolling z-score rule.</p>}</article>
    </section>
    <section className="pipeline-board"><div className="pipeline-board__intro"><Radar size={30}/><div><span className="ops-eyebrow">CURRENT PIPELINE</span><h2>From source contract to monitored signal.</h2></div></div>{readiness.data?.pipeline.map((stage, index) => { const Icon = stateVisual[stage.state]; return <article className={`pipeline-stage pipeline-stage--${stage.state}`} key={stage.id}><span>0{index + 1}</span><Icon size={23}/><div><b>{stage.label}</b><p>{stage.evidence}</p></div><em>{stage.state}</em></article>; })}</section>
    <section className="workspace-panel intelligence-note"><h2>Responsible AI posture</h2><p>{data?.carbonTotals.factorLabel} The worker does not call an LLM. Any future explanation or recommendation must cite persisted evidence and cannot alter calculated values.</p></section>
  </div>;
}

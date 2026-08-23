import React, { useState } from "react";
import { Activity, CalendarClock, CheckCircle2, CirclePause, CloudCog, ExternalLink, Loader2, LockKeyhole, ShieldAlert, ShieldCheck, TimerReset } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

const cadenceOptions = [
  { value: 15, label: "Every 15 minutes", detail: "Rapid trial cadence for controlled monitoring evidence" },
  { value: 30, label: "Every 30 minutes", detail: "Moderate monitoring cadence" },
  { value: 60, label: "Hourly", detail: "Standard operational cadence" },
  { value: 360, label: "Every 6 hours", detail: "Low-frequency continuity check" },
  { value: 1440, label: "Daily at 02:00 UTC", detail: "Daily stewardship review" },
] as const;

function statusLabel(value: string | undefined | null) {
  if (!value) return "Not configured";
  return value.replaceAll("_", " ");
}

export default function AdministrationWorkspace() {
  const utils = trpc.useUtils();
  const tenant = useActiveOrganization();
  const organizationId = tenant.organizationId ?? 0;
  const [cadenceMinutes, setCadenceMinutes] = useState<(typeof cadenceOptions)[number]["value"]>(15);
  const [staleAfterMinutes, setStaleAfterMinutes] = useState(45);
  const [notice, setNotice] = useState<string | null>(null);
  const statusQuery = trpc.administration.applicationStatus.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const schedulerQuery = trpc.schedulerTrial.status.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const refresh = async () => { await Promise.all([statusQuery.refetch(), schedulerQuery.refetch()]); };
  const saveDraft = trpc.schedulerTrial.saveDraft.useMutation({
    onSuccess: async () => { await Promise.all([utils.schedulerTrial.status.invalidate({ organizationId }), utils.administration.applicationStatus.invalidate({ organizationId })]); setNotice("Scheduler trial plan saved. It will not run until an owner activates it from the deployed application."); },
    onError: (error) => setNotice(`Scheduler trial plan was not saved: ${error.message}`),
  });
  const activate = trpc.schedulerTrial.activate.useMutation({
    onSuccess: async () => { await Promise.all([utils.schedulerTrial.status.invalidate({ organizationId }), utils.administration.applicationStatus.invalidate({ organizationId })]); setNotice("Scheduler trial activated. Monitor the next scheduled run and recovery evidence before relying on recurrence."); },
    onError: (error) => setNotice(`Scheduler trial was not activated: ${error.message}`),
  });
  const pause = trpc.schedulerTrial.pause.useMutation({
    onSuccess: async () => { await Promise.all([utils.schedulerTrial.status.invalidate({ organizationId }), utils.administration.applicationStatus.invalidate({ organizationId })]); setNotice("Scheduler trial paused. No further scheduled callback will be expected until an owner resumes it."); },
    onError: (error) => setNotice(`Scheduler pause was not completed: ${error.message}`),
  });

  if (tenant.isLoading || statusQuery.isLoading || schedulerQuery.isLoading) return <div className="app-loading-state"><Loader2 className="animate-spin" /> Loading administration evidence…</div>;
  if (tenant.error || statusQuery.error || schedulerQuery.error) return <section className="workspace-error"><span className="ops-eyebrow"><span /> ADMINISTRATION UNAVAILABLE</span><h1>Protected administration evidence could not be loaded.</h1><p>Health, readiness, and scheduling values are never inferred from an unavailable query.</p><button onClick={() => void refresh()}>Retry administration query</button></section>;
  if (!tenant.activeOrganization || !statusQuery.data || !schedulerQuery.data) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> ADMINISTRATION NEEDS A TENANT</span><h1>Start from a tenant boundary.</h1><p>Create an organization before reviewing protected application status or configuring monitored work.</p></section>;

  const status = statusQuery.data;
  const scheduler = schedulerQuery.data.configuration;
  const owner = status.viewerRole === "owner";
  const deploymentReady = status.deploymentReady && schedulerQuery.data.deploymentReady;
  const hasDraft = Boolean(scheduler?.scheduleCronExpression);
  const active = scheduler?.schedulerTrialStatus === "active";
  const cadence = cadenceOptions.find((option) => option.value === cadenceMinutes)!;

  return <div className="ecosystem-page administration-page">
    <header className="workspace-header"><div><span className="ops-eyebrow"><span /> ADMINISTRATION</span><h1>Operate from verified service evidence.</h1><p>This protected workspace keeps application health, readiness dependencies, and the scheduler trial in one auditable operating view.</p></div><div className="tenant-badge"><CloudCog size={18} /><span>{status.viewerRole}</span><b>Governance access</b></div></header>
    {notice && <div className="workbench-notice" role={notice.includes("not ") || notice.includes("was not") ? "alert" : "status"}>{notice}</div>}

    <section className="admin-health-grid" aria-label="Application health and readiness">
      <article className="admin-status-card"><Activity size={21} /><span>LIVENESS</span><strong>{status.liveness.ok ? "Healthy" : "Unavailable"}</strong><small>Service response is available.</small></article>
      <article className="admin-status-card"><ShieldCheck size={21} /><span>READINESS</span><strong>{status.readiness.ok ? "Ready" : "Blocked"}</strong><small>HTTP {status.readinessStatus} · database {status.readiness.dependencies.database}</small></article>
      <article className="admin-status-card"><CalendarClock size={21} /><span>SCHEDULER</span><strong>{statusLabel(scheduler?.schedulerTrialStatus)}</strong><small>{deploymentReady ? "Deployed scheduling controls available" : "Publish required before activation"}</small></article>
      <article className="admin-status-card"><TimerReset size={21} /><span>MONITORING HEALTH</span><strong>{statusLabel(status.monitoringHealth.state)}</strong><small>{status.monitoringHealth.latestScheduledRun ? `Latest scheduled run: ${status.monitoringHealth.latestScheduledRun.status}` : "No scheduled run recorded"}</small></article>
    </section>

    <section className="admin-grid">
      <article className="workspace-panel admin-health-panel"><header><div><span className="ops-eyebrow">DEPENDENCY STATUS</span><h2>Health and readiness</h2></div><ShieldCheck size={22} /></header><div className="admin-checks"><div><CheckCircle2 size={17} /><span>Database</span><b>{status.readiness.dependencies.database}</b></div><div><CalendarClock size={17} /><span>Platform scheduler</span><b>{status.readiness.dependencies.scheduler.replaceAll("_", " ")}</b></div><div><Activity size={17} /><span>Request telemetry</span><b>Correlation-safe</b></div></div><p className="muted">{status.telemetry.requestCorrelation}</p><div className="workspace-actions"><a className="workspace-link" href="/healthz" target="_blank" rel="noreferrer">Open liveness <ExternalLink size={15} /></a><a className="workspace-link" href="/readyz" target="_blank" rel="noreferrer">Open readiness <ExternalLink size={15} /></a><button className="workspace-link" onClick={() => void refresh()}>Refresh evidence <TimerReset size={15} /></button></div></article>

      <article className="workspace-panel scheduler-trial-panel"><header><div><span className="ops-eyebrow">AUTHENTICATED SCHEDULER TRIAL</span><h2>Configure before you activate.</h2></div><CalendarClock size={22} /></header><p>Saving a plan only records tenant-scoped readiness expectations. A platform schedule is created or resumed only when a tenant owner activates the plan from a deployed application.</p><div className="scheduler-form"><label><span>Trial cadence</span><select aria-label="Scheduler trial cadence" value={cadenceMinutes} disabled={active || saveDraft.isPending} onChange={(event) => { const next = Number(event.target.value) as typeof cadenceMinutes; setCadenceMinutes(next); setStaleAfterMinutes(Math.max(next * 3, 15)); }} >{cadenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>{cadence.detail}</small></label><label><span>Stale-after threshold (minutes)</span><input aria-label="Scheduler stale-after threshold" type="number" min={cadenceMinutes} max={10080} value={staleAfterMinutes} disabled={active || saveDraft.isPending} onChange={(event) => setStaleAfterMinutes(Number(event.target.value))} /><small>Must be at least the trial cadence; creates recovery evidence when missed.</small></label></div><div className="scheduler-state"><ShieldCheck size={18} /><div><b>{hasDraft ? "Trial plan recorded" : "No plan recorded"}</b><span>{scheduler?.scheduleCronExpression ? `UTC cron: ${scheduler.scheduleCronExpression}` : "Choose a cadence and save a trial plan before activation."}</span></div></div><div className="workspace-actions"><button onClick={() => saveDraft.mutate({ organizationId, cadenceMinutes, staleAfterMinutes })} disabled={!status.viewerRole || active || saveDraft.isPending}>{saveDraft.isPending ? <Loader2 className="animate-spin" /> : <CalendarClock size={16} />}{saveDraft.isPending ? "Saving plan…" : active ? "Pause before editing" : "Save trial plan"}</button>{active ? <button className="secondary-action" onClick={() => pause.mutate({ organizationId })} disabled={!owner || !deploymentReady || pause.isPending}>{pause.isPending ? "Pausing…" : <><CirclePause size={16} /> Pause trial</>}</button> : <button className="secondary-action" onClick={() => activate.mutate({ organizationId })} disabled={!owner || !deploymentReady || !hasDraft || activate.isPending}>{activate.isPending ? "Activating…" : <><LockKeyhole size={16} /> Activate trial</>}</button>}</div>{!owner && <p className="admin-guard"><ShieldAlert size={16} /> Owners can activate or pause a platform scheduler. Managers can prepare the plan and review evidence.</p>}{owner && !deploymentReady && <p className="admin-guard"><ShieldAlert size={16} /> Publish the application, then verify deployed `/healthz` and `/readyz` before activation becomes available.</p>}</article>
    </section>
  </div>;
}

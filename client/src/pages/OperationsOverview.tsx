import React from "react";
import { Activity, ArrowUpRight, Building2, CheckCircle2, ClipboardCheck, Database, FileUp, Gauge, Radio, Settings2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

function relativeTime(value: Date | null | undefined) {
  if (!value) return "No reading recorded";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  return minutes < 1 ? "Just now" : `${minutes} min ago`;
}

export default function OperationsOverview() {
  const [, navigate] = useLocation();
  const organization = useActiveOrganization();
  const organizationId = organization.organizationId ?? 0;
  const overviewQuery = trpc.operations.overview.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const readingsQuery = trpc.readings.recent.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const actionsQuery = trpc.actions.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });

  if (organization.isLoading) return <div className="app-loading-state"><Activity className="animate-spin" /> Loading workspace…</div>;
  if (!organization.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> FIRST OPERATIONAL STEP</span><h1>Start with a tenant boundary.</h1><p>Create your organization, register its first site, and define the meter units that live data must satisfy.</p><button onClick={() => navigate("/app/registry")}>Open registry <ArrowUpRight size={16} /></button></section>;

  const overview = overviewQuery.data;
  const activeActions = actionsQuery.data?.filter((item) => item.status === "in_progress") ?? [];
  return <div className="ecosystem-page">
    <header className="workspace-header"><div><span className="ops-eyebrow"><span /> OPERATIONS OVERVIEW</span><h1>{organization.activeOrganization.organization.name}</h1><p>One authenticated view of the records that power the sustainability operating loop.</p></div><div className="tenant-badge"><Building2 size={18} /><span>{organization.activeOrganization.membership.role}</span><b>Tenant scoped</b></div></header>
    <section className="overview-metrics" aria-label="Operational tenant metrics">
      <article><Database size={20}/><span>REGISTERED METERS</span><strong>{overview?.meterCount ?? "—"}</strong><small>canonical source boundaries</small></article>
      <article><Radio size={20}/><span>VALIDATED READINGS</span><strong>{overview?.readingCount ?? "—"}</strong><small>{relativeTime(overview?.latestReadingAt)}</small></article>
      <article><ClipboardCheck size={20}/><span>ACTIVE ACTIONS</span><strong>{overview?.activeActionCount ?? "—"}</strong><small>{overview?.actionCount ?? 0} total tracked actions</small></article>
      <article><Gauge size={20}/><span>MONITORING STATUS</span><strong>STAGED</strong><small>worker remains planned</small></article>
    </section>
    <section className="overview-grid">
      <article className="workspace-panel"><header><div><span className="ops-eyebrow">NEXT USEFUL STEP</span><h2>{overview?.meterCount ? overview?.readingCount ? "Turn verified data into a monitored signal." : "Send the first validated reading." : "Register canonical measurement sources."}</h2></div><Settings2 size={22}/></header><p>{overview?.meterCount ? overview?.readingCount ? "The registry and data foundation are active. The Intelligence workspace makes the pending monitoring boundary explicit." : "Your meters are registered. Use Live Data to record a first source-backed measurement." : "Define a site and meter in the Registry before any incoming data can be trusted."}</p><button className="workspace-link" onClick={() => navigate(overview?.meterCount ? overview?.readingCount ? "/app/intelligence" : "/app/data" : "/app/registry")}>Continue the loop <ArrowUpRight size={16}/></button></article>
      <article className="workspace-panel workspace-panel--signal"><header><div><span className="ops-eyebrow">CURRENT DATA EVIDENCE</span><h2>Recent readings</h2></div><FileUp size={22}/></header>{readingsQuery.isLoading ? <p>Loading protected readings…</p> : readingsQuery.data?.length ? <div className="compact-list">{readingsQuery.data.slice(0, 4).map(({ reading, meter }) => <div key={reading.id}><span>{meter.displayName}</span><b>{reading.value} {reading.unit}</b><small>{new Date(reading.observedAt).toLocaleString()}</small></div>)}</div> : <p>No readings are stored for this tenant. This is expected until the first validated intake occurs.</p>}<button className="workspace-link" onClick={() => navigate("/app/data")}>Open Live Data <ArrowUpRight size={16}/></button></article>
      <article className="workspace-panel workspace-panel--wide"><header><div><span className="ops-eyebrow">ACCOUNTABLE WORK</span><h2>Actions in motion</h2></div><CheckCircle2 size={22}/></header>{activeActions.length ? <div className="action-summary">{activeActions.map((action) => <div key={action.id}><span>{action.priority}</span><b>{action.title}</b><small>{action.expectedCarbonReductionKg ? `${action.expectedCarbonReductionKg} kgCO₂e expected` : "Impact estimate not recorded"}</small></div>)}</div> : <p>No action is currently in progress. Add a scoped intervention when a validated signal needs accountable follow-through.</p>}<button className="workspace-link" onClick={() => navigate("/app/actions")}>Manage actions <ArrowUpRight size={16}/></button></article>
    </section>
  </div>;
}

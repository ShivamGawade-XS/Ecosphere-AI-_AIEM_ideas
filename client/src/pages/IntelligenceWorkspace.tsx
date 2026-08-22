import React from "react";
import { BrainCircuit, CheckCircle2, CircleDashed, Clock3, Radar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

const stateVisual = { ready: CheckCircle2, waiting: CircleDashed, blocked: CircleDashed, planned: Clock3 };

export default function IntelligenceWorkspace() {
  const tenant = useActiveOrganization();
  const organizationId = tenant.organizationId ?? 0;
  const readiness = trpc.intelligence.readiness.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  if (tenant.isLoading || readiness.isLoading) return <div className="app-loading-state"><CircleDashed className="animate-spin"/> Loading evidence boundary…</div>;
  if (tenant.error || readiness.error) return <section className="workspace-error"><span className="ops-eyebrow"><span /> EVIDENCE UNAVAILABLE</span><h1>Intelligence status could not be loaded.</h1><p>The workspace did not infer a status. Check your connection and retry the protected query.</p><button onClick={() => readiness.refetch()}>Retry evidence query</button></section>;
  if (!tenant.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> INTELLIGENCE REQUIRES EVIDENCE</span><h1>Register the data path first.</h1><p>Analytics is intentionally unavailable until a tenant, a canonical source, and verified readings exist.</p></section>;
  return <div className="ecosystem-page"><header className="workspace-header"><div><span className="ops-eyebrow"><span /> INTELLIGENCE</span><h1>Make the analytics boundary inspectable.</h1><p>This workspace only reports what the current server data foundation can substantiate. It does not manufacture alerts, forecasts, or recommendations.</p></div><div className="tenant-badge"><BrainCircuit size={18}/><span>Evidence first</span><b>Staged</b></div></header><section className="pipeline-board"><div className="pipeline-board__intro"><Radar size={30}/><div><span className="ops-eyebrow">CURRENT PIPELINE</span><h2>From source contract to analytics service.</h2></div></div>{readiness.data?.pipeline.map((stage, index) => { const Icon = stateVisual[stage.state]; return <article className={`pipeline-stage pipeline-stage--${stage.state}`} key={stage.id}><span>0{index + 1}</span><Icon size={23}/><div><b>{stage.label}</b><p>{stage.evidence}</p></div><em>{stage.state}</em></article>; })}</section><section className="workspace-panel intelligence-note"><h2>Responsible AI posture</h2><p>EcoSphere’s future recommendation layer may explain a source-backed, deterministic outcome. It must not select or invent numerical evidence. Monitoring, anomaly, forecast, score, and recommendation services remain explicitly planned until their worker, model/version, and audit trail are implemented.</p></section></div>;
}

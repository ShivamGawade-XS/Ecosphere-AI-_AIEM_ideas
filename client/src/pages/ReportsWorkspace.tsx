import React from "react";
import { Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

export default function ReportsWorkspace() {
  const tenant = useActiveOrganization();
  const organizationId = tenant.organizationId ?? 0;
  const summary = trpc.reports.summary.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  function exportSnapshot() {
    if (!summary.data || !tenant.activeOrganization) return;
    const rows = [["EcoSphere AI operational snapshot"], ["Organization", tenant.activeOrganization.organization.name], ["Registered sites", String(summary.data.overview.siteCount)], ["Registered meters", String(summary.data.overview.meterCount)], ["Persisted readings", String(summary.data.overview.readingCount)], ["Tracked actions", String(summary.data.overview.actionCount)], ["Active actions", String(summary.data.overview.activeActionCount)], ["Generated at", new Date().toISOString()]];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "ecosphere-operational-snapshot.csv"; link.click(); URL.revokeObjectURL(link.href);
  }
  if (tenant.isLoading || summary.isLoading) return <div className="app-loading-state"><Loader2 className="animate-spin"/> Loading report boundary…</div>;
  if (tenant.error || summary.error) return <section className="workspace-error"><span className="ops-eyebrow"><span /> REPORT UNAVAILABLE</span><h1>Operational records could not be summarized.</h1><p>No export is offered until the protected report query succeeds.</p><button onClick={() => summary.refetch()}>Retry report query</button></section>;
  if (!tenant.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span /> REPORTING NEEDS EVIDENCE</span><h1>Nothing is reportable yet.</h1><p>Create an organization and establish a source registry before producing a scoped operational snapshot.</p></section>;
  const overview = summary.data?.overview;
  return <div className="ecosystem-page"><header className="workspace-header"><div><span className="ops-eyebrow"><span /> REPORTS</span><h1>Export only what the records support.</h1><p>This report foundation summarizes tenant-scoped operational evidence. It is not a certified sustainability disclosure or regulatory filing.</p></div><button className="export-button" onClick={exportSnapshot} disabled={!summary.data}><Download size={16}/> Export CSV snapshot</button></header><section className="report-sheet"><div className="report-sheet__stamp"><FileText size={27}/><span>OPERATIONAL SNAPSHOT</span><b>Tenant scoped</b></div><div className="report-stats"><div><span>SITES</span><b>{overview?.siteCount ?? 0}</b></div><div><span>METERS</span><b>{overview?.meterCount ?? 0}</b></div><div><span>READINGS</span><b>{overview?.readingCount ?? 0}</b></div><div><span>ACTIONS</span><b>{overview?.actionCount ?? 0}</b></div></div><div className="report-disclaimer"><ShieldCheck size={20}/><p>Scope: organization registry, persisted readings, ingestion history, and tracked actions. Carbon calculations, assurance, and certified-report formats are not yet implemented.</p></div></section><section className="workspace-panel"><span className="ops-eyebrow">INGESTION HISTORY</span><h2>Recent source submissions</h2>{summary.data?.recentBatches.length ? <div className="compact-list">{summary.data.recentBatches.map((batch) => <div key={batch.id}><span>#{batch.id} · {batch.source}</span><b>{batch.acceptedRows}/{batch.totalRows} accepted</b><small>{batch.status}</small></div>)}</div> : <p>No ingestion batch has been recorded for this tenant.</p>}</section></div>;
}

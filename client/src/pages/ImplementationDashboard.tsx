import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDashed, Clock3, Database, RefreshCw, ShieldCheck } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | "complete" | "in_progress" | "planned";

const statusCopy = {
  complete: { label: "Implemented", icon: CheckCircle2, tone: "success" },
  in_progress: { label: "In progress", icon: CircleDashed, tone: "progress" },
  planned: { label: "Planned", icon: Clock3, tone: "planned" },
} as const;

export default function ImplementationDashboard() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const statusQuery = trpc.implementation.status.useQuery();
  const organizationsQuery = trpc.organizations.mine.useQuery();
  const status = statusQuery.data;
  const filtered = useMemo(
    () => status?.items.filter((item) => filter === "all" || item.status === filter) ?? [],
    [filter, status?.items],
  );
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? status?.items[0];

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  if (statusQuery.isLoading || organizationsQuery.isLoading) {
    return <div className="app-loading-state"><CircleDashed className="animate-spin" size={28} /> Loading production readiness…</div>;
  }

  if (statusQuery.error || organizationsQuery.error || !status) {
    return (
      <section className="app-error-state">
        <AlertTriangle size={24} />
        <div><h1>Readiness data is unavailable.</h1><p>Confirm your authenticated session and try again.</p></div>
        <button onClick={() => statusQuery.refetch()}>Retry</button>
      </section>
    );
  }

  const completion = Math.round((status.summary.complete / status.summary.total) * 100);
  return (
    <div className="operations-canvas">
      <section className="operations-hero">
        <div>
          <span className="ops-eyebrow"><span /> PRODUCTION READINESS CONTROL</span>
          <h1>Build the evidence,<br /><em>not just the interface.</em></h1>
          <p>This authenticated workspace tracks the implementation path from the Field Operations Ledger prototype to a trusted sustainability platform.</p>
        </div>
        <aside className="completion-dial" aria-label={`${completion}% of current implementation status is complete`}>
          <div className="completion-dial__ring" style={{ "--completion": `${completion * 3.6}deg` } as React.CSSProperties}><b>{completion}%</b><span>current core</span></div>
          <p>{status.summary.complete} implemented · {status.summary.inProgress} active · {status.summary.planned} planned</p>
        </aside>
      </section>

      <section className="operations-metric-strip" aria-label="Platform foundation summary">
        <div><Database size={18} /><span>ORGANIZATIONS</span><strong>{status.summary.organizationCount}</strong><small>authenticated tenants</small></div>
        <div><ShieldCheck size={18} /><span>TRUST BOUNDARY</span><strong>SERVER</strong><small>protected procedures</small></div>
        <div><CheckCircle2 size={18} /><span>API FOUNDATION</span><strong>READY</strong><small>registry + ingestion</small></div>
      </section>

      <section className="readiness-board">
        <header className="readiness-board__header">
          <div><span className="ops-eyebrow">IMPLEMENTATION INVENTORY</span><h2>Production readiness, item by item.</h2></div>
          <button className="refresh-button" onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching}><RefreshCw className={statusQuery.isFetching ? "animate-spin" : ""} size={15} /> Refresh evidence</button>
        </header>
        <div className="readiness-filter" role="group" aria-label="Filter implementation status">
          {(["all", "complete", "in_progress", "planned"] as const).map((item) => <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All requirements" : statusCopy[item].label}</button>)}
        </div>
        <div className="readiness-grid">
          <div className="readiness-list">
            {filtered.map((item) => {
              const config = statusCopy[item.status];
              const Icon = config.icon;
              return <button key={item.id} className={`readiness-item readiness-item--${config.tone} ${selected?.id === item.id ? "is-selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                <Icon size={19} /><div><span>{item.area}</span><strong>{item.title}</strong></div><ArrowUpRight size={16} />
              </button>;
            })}
          </div>
          {selected && (() => {
            const config = statusCopy[selected.status];
            const Icon = config.icon;
            return <aside className="readiness-detail">
              <div className={`status-mark status-mark--${config.tone}`}><Icon size={22} /></div>
              <span>{selected.area.toUpperCase()} · {config.label.toUpperCase()}</span>
              <h3>{selected.title}</h3>
              <p>{selected.evidence}</p>
              <div className="detail-rule" />
              <small>Implementation status is stored as a versioned product inventory. Operational metrics and service-level objectives are introduced in subsequent platform phases.</small>
            </aside>;
          })()}
        </div>
      </section>
    </div>
  );
}

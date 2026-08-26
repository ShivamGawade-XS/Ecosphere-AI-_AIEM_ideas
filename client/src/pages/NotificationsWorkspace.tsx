import React from "react";
import { AlertTriangle, ArrowUpRight, Bell, CheckCheck, CircleAlert, FileWarning, HeartPulse, Inbox, TimerReset } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

const iconByKind = { alert: CircleAlert, import: FileWarning, action: TimerReset, monitoring: HeartPulse } as const;

export default function NotificationsWorkspace() {
  const [, navigate] = useLocation();
  const organization = useActiveOrganization();
  const organizationId = organization.organizationId ?? 0;
  const inbox = trpc.notifications.inbox.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const utils = trpc.useUtils();
  const setReadState = trpc.notifications.setReadState.useMutation({ onSuccess: async () => { await utils.notifications.inbox.invalidate({ organizationId }); } });

  if (organization.isLoading) return <div className="app-loading-state"><Bell className="animate-pulse" /> Loading notification centre…</div>;
  if (organization.error) return <section className="app-error-state" role="alert"><AlertTriangle size={24}/><div><h1>Tenant access is unavailable.</h1><p>Confirm your authenticated session and tenant membership, then refresh the notification centre.</p></div></section>;
  if (!organization.activeOrganization) return <section className="empty-workspace"><span className="ops-eyebrow"><span/> TENANT EVIDENCE BOUNDARY</span><h1>Create a tenant before monitoring its inbox.</h1><p>Notifications are derived from tenant-scoped operational records. Set up the organization and its source registry first.</p><button onClick={() => navigate("/app/registry")}>Open registry <ArrowUpRight size={16}/></button></section>;

  return <div className="ecosystem-page notification-centre">
    <header className="workspace-header"><div><span className="ops-eyebrow"><span/> IN-APP NOTIFICATION CENTRE</span><h1>Operational inbox</h1><p>Review active tenant evidence that may need attention. This is an in-app view, not confirmation of an external email, SMS, push, or escalation delivery.</p></div><div className="tenant-badge"><Bell size={18}/><span>{inbox.data?.unreadCount ?? "—"}</span><b>Unread</b></div></header>
    {inbox.isLoading ? <section className="workspace-panel"><p role="status">Deriving the in-app inbox from tenant evidence…</p></section> : inbox.error ? <section className="workspace-panel" role="alert"><p className="form-error">The notification inbox is unavailable. No notification state is inferred.</p></section> : <>
      <section className="workspace-panel notification-disclosure"><Inbox size={22}/><div><span className="ops-eyebrow">EVIDENCE AND DELIVERY BOUNDARY</span><p>{inbox.data?.disclosure}</p></div></section>
      <section className="notification-list" aria-label="Tenant operational notifications">{inbox.data?.items.length ? inbox.data.items.map((item) => { const Icon = iconByKind[item.kind]; const isRead = item.readAt !== null; return <article key={item.key} className={`notification-item notification-item--${item.priority} ${isRead ? "is-read" : "is-unread"}`}><Icon size={20}/><div className="notification-item__body"><div><span>{item.kind.toUpperCase()} · {item.priority} priority</span>{!isRead && <b>Unread</b>}</div><h2>{item.title}</h2><p>{item.detail}</p><small>Evidence recorded {new Date(item.occurredAt).toLocaleString()} · {isRead ? `read ${new Date(item.readAt!).toLocaleString()}` : "not yet marked read"}</small></div><div className="notification-item__actions"><button type="button" onClick={() => navigate(item.workspacePath)}>Review evidence <ArrowUpRight size={15}/></button><button type="button" disabled={setReadState.isPending} onClick={() => setReadState.mutate({ organizationId, notificationKey: item.key, read: isRead ? false : true })}>{setReadState.isPending ? "Updating…" : isRead ? "Mark unread" : <><CheckCheck size={15}/> Mark read</>}</button></div></article>; }) : <section className="workspace-panel notification-empty"><CheckCheck size={23}/><div><span className="ops-eyebrow">NO ACTIVE INBOX ITEMS</span><h2>No current in-app evidence requires attention.</h2><p>Open alerts, failed or partial imports, overdue actions, enabled-schedule failures or staleness, and open monitoring recoveries will appear here when their source records exist.</p></div></section>}</section>
      {setReadState.error ? <p className="form-error" role="alert">{setReadState.error.message}</p> : null}
    </>}
  </div>;
}

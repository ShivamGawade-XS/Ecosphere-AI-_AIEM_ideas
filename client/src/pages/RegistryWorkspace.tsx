import React, { FormEvent, useEffect, useState } from "react";
import { Building2, Database, Loader2, MapPin, Plus, Radio } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

const units: Record<"energy" | "water" | "waste" | "fuel" | "renewable", string> = { energy: "kWh", water: "m³", waste: "kg", fuel: "L", renewable: "kWh" };

export default function RegistryWorkspace() {
  const utils = trpc.useUtils();
  const tenant = useActiveOrganization();
  const organizationId = tenant.organizationId ?? 0;
  const sitesQuery = trpc.sites.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const metersQuery = trpc.meters.list.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const [orgName, setOrgName] = useState("AIEM Campus Pilot");
  const [siteName, setSiteName] = useState("AIEM Main Campus");
  const [siteCode, setSiteCode] = useState("AIEM-MAIN");
  const [siteId, setSiteId] = useState<number | null>(null);
  const [meterName, setMeterName] = useState("HVAC Electricity");
  const [meterKey, setMeterKey] = useState("hvac-main");
  const [resourceType, setResourceType] = useState<keyof typeof units>("energy");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { if (siteId === null && sitesQuery.data?.[0]) setSiteId(sitesQuery.data[0].id); }, [siteId, sitesQuery.data]);
  const createOrganization = trpc.organizations.create.useMutation({ onSuccess: async () => { await utils.organizations.mine.invalidate(); setNotice("Organization created. The tenant is now ready for site registration."); } });
  const createSite = trpc.sites.create.useMutation({ onSuccess: async () => { await utils.sites.list.invalidate({ organizationId }); setNotice("Site registered. Define a canonical source before submitting data."); } });
  const createMeter = trpc.meters.create.useMutation({ onSuccess: async () => { await utils.meters.list.invalidate({ organizationId }); setNotice("Meter registered with a canonical unit."); } });
  const busy = createOrganization.isPending || createSite.isPending || createMeter.isPending;

  return <div className="ecosystem-page"><header className="workspace-header"><div><span className="ops-eyebrow"><span /> REGISTRY</span><h1>Define what can be measured.</h1><p>Every live reading is scoped to an organization, a site, a meter, a resource type, and a canonical unit.</p></div><div className="tenant-badge"><Database size={18}/><span>{tenant.activeOrganization?.organization.name ?? "No tenant"}</span><b>Foundation</b></div></header>{notice && <div className="workbench-notice" role="status">{notice}</div>}
    <section className="registry-grid"><form onSubmit={(event: FormEvent) => { event.preventDefault(); createOrganization.mutate({ name: orgName }); }} className="registry-card"><span>01 · TENANT</span><Building2 size={23}/><h2>Organization</h2><p>Creates the access and data-isolation boundary.</p><input value={orgName} onChange={(event) => setOrgName(event.target.value)} aria-label="Organization name" required minLength={3}/><button disabled={Boolean(tenant.activeOrganization) || busy}>{createOrganization.isPending ? <Loader2 className="animate-spin"/> : <Plus/>} {tenant.activeOrganization ? "Tenant active" : "Create organization"}</button></form>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (organizationId) createSite.mutate({ organizationId, name: siteName, code: siteCode, timezone: "Asia/Kolkata" }); }} className="registry-card"><span>02 · LOCATION</span><MapPin size={23}/><h2>Site</h2><p>Registers a campus or building inside the selected tenant.</p><input value={siteName} onChange={(event) => setSiteName(event.target.value)} aria-label="Site name" required/><input value={siteCode} onChange={(event) => setSiteCode(event.target.value.toUpperCase())} aria-label="Site code" required pattern="[A-Z0-9_-]{2,64}"/><button disabled={!organizationId || busy}>{createSite.isPending ? <Loader2 className="animate-spin"/> : <Plus/>} Register site</button></form>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (organizationId && siteId) createMeter.mutate({ organizationId, siteId, displayName: meterName, meterKey, resourceType, canonicalUnit: units[resourceType] }); }} className="registry-card"><span>03 · SOURCE</span><Radio size={23}/><h2>Meter</h2><p>Creates a validated source contract for incoming data.</p><select value={siteId ?? ""} onChange={(event) => setSiteId(Number(event.target.value))} aria-label="Meter site"><option value="" disabled>Select site</option>{sitesQuery.data?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select><input value={meterName} onChange={(event) => setMeterName(event.target.value)} aria-label="Meter name" required/><input value={meterKey} onChange={(event) => setMeterKey(event.target.value.toLowerCase())} aria-label="Meter key" required pattern="[a-z0-9_-]{3,96}"/><select value={resourceType} onChange={(event) => setResourceType(event.target.value as keyof typeof units)} aria-label="Resource type">{Object.entries(units).map(([type, unit]) => <option key={type} value={type}>{type} · {unit}</option>)}</select><button disabled={!siteId || busy}>{createMeter.isPending ? <Loader2 className="animate-spin"/> : <Plus/>} Register meter</button></form></section>
    <section className="evidence-board"><header><div><span className="ops-eyebrow">REGISTERED EVIDENCE</span><h2>Active tenant inventory</h2></div><Database size={23}/></header><div className="evidence-columns"><div><h3>Sites</h3>{sitesQuery.data?.length ? sitesQuery.data.map((site) => <p key={site.id}><b>{site.name}</b><span>{site.code} · {site.timezone}</span></p>) : <p className="muted">No site registered yet.</p>}</div><div><h3>Meters</h3>{metersQuery.data?.length ? metersQuery.data.map((meter) => <p key={meter.id}><b>{meter.displayName}</b><span>{meter.resourceType} · {meter.canonicalUnit}</span></p>) : <p className="muted">No meter registered yet.</p>}</div></div></section>
  </div>;
}

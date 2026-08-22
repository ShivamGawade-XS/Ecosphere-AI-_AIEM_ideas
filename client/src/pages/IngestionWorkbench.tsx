import { trpc } from "@/lib/trpc";
import { CheckCircle2, Database, Loader2, Plus, Radio, Send, ShieldCheck } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";

const resourceUnits: Record<string, string> = { energy: "kWh", water: "m³", waste: "kg", fuel: "L", renewable: "kWh" };

export default function IngestionWorkbench() {
  const utils = trpc.useUtils();
  const organizationsQuery = trpc.organizations.mine.useQuery();
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [siteId, setSiteId] = useState<number | null>(null);
  const [meterId, setMeterId] = useState<number | null>(null);
  const [organizationName, setOrganizationName] = useState("AIEM Campus Pilot");
  const [siteName, setSiteName] = useState("AIEM Main Campus");
  const [siteCode, setSiteCode] = useState("AIEM-MAIN");
  const [meterName, setMeterName] = useState("HVAC Electricity");
  const [meterKey, setMeterKey] = useState("hvac-main");
  const [resourceType, setResourceType] = useState<"energy" | "water" | "waste" | "fuel" | "renewable">("energy");
  const [readingValue, setReadingValue] = useState("112.5");
  const [readingSource, setReadingSource] = useState<"manual" | "simulated">("manual");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId && organizationsQuery.data?.[0]) setOrganizationId(organizationsQuery.data[0].organization.id);
  }, [organizationId, organizationsQuery.data]);

  const sitesQuery = trpc.sites.list.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const metersQuery = trpc.meters.list.useQuery({ organizationId: organizationId ?? 0, siteId: siteId ?? undefined }, { enabled: Boolean(organizationId) });
  useEffect(() => { if (!siteId && sitesQuery.data?.[0]) setSiteId(sitesQuery.data[0].id); }, [siteId, sitesQuery.data]);
  useEffect(() => { if (!meterId && metersQuery.data?.[0]) setMeterId(metersQuery.data[0].id); }, [meterId, metersQuery.data]);

  const createOrganization = trpc.organizations.create.useMutation({ onSuccess: async (created) => { await utils.organizations.mine.invalidate(); setOrganizationId(created.id); setNotice("Organization created. Add its first operational site."); } });
  const createSite = trpc.sites.create.useMutation({ onSuccess: async (created) => { if (organizationId) await utils.sites.list.invalidate({ organizationId }); setSiteId(created.id); setNotice("Site registered. Add a canonical meter before ingesting data."); } });
  const createMeter = trpc.meters.create.useMutation({ onSuccess: async (created) => { if (organizationId) await utils.meters.list.invalidate({ organizationId }); setMeterId(created.id); setNotice("Meter registered. The live reading endpoint is ready."); } });
  const ingestReading = trpc.readings.ingest.useMutation({ onSuccess: async (result) => { if (organizationId) await utils.ingestion.recent.invalidate({ organizationId }); setNotice(result.idempotent ? "This reading was already accepted; duplicate data was not created." : readingSource === "simulated" ? "Simulated pilot reading accepted and visibly labeled in provenance." : "Reading accepted and recorded with provenance."); } });
  const batchesQuery = trpc.ingestion.recent.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });

  function submitOrganization(event: FormEvent) { event.preventDefault(); createOrganization.mutate({ name: organizationName }); }
  function submitSite(event: FormEvent) { event.preventDefault(); if (organizationId) createSite.mutate({ organizationId, name: siteName, code: siteCode, timezone: "Asia/Kolkata" }); }
  function submitMeter(event: FormEvent) { event.preventDefault(); if (organizationId && siteId) createMeter.mutate({ organizationId, siteId, displayName: meterName, meterKey, resourceType, canonicalUnit: resourceUnits[resourceType] }); }
  function submitReading(event: FormEvent) { event.preventDefault(); const meter = metersQuery.data?.find((item) => item.id === meterId); if (organizationId && siteId && meterId && meter) ingestReading.mutate({ organizationId, siteId, meterId, observedAt: new Date(), value: Number(readingValue), unit: meter.canonicalUnit, source: readingSource, idempotencyKey: `${readingSource}-${meterId}-${Date.now()}`, provenance: { entryMethod: "operations-workbench", simulated: readingSource === "simulated", label: readingSource === "simulated" ? "AIEM pilot verification fixture — simulated" : "Manual operational entry" } }); }

  const isWorking = createOrganization.isPending || createSite.isPending || createMeter.isPending || ingestReading.isPending;
  return <div className="workbench-canvas">
    <section className="workbench-hero"><div><span className="ops-eyebrow"><span /> LIVE DATA FOUNDATION</span><h1>Register a source.<br /><em>Protect the evidence.</em></h1><p>This workbench exercises the authenticated registry and ingestion APIs. Each accepted reading is scoped to an organization, validated against a canonical meter unit, deduplicated, and written with provenance.</p></div><div className="workbench-hero__signal"><Radio size={28} /><b>DATA INTAKE</b><span>auth · validation · provenance</span></div></section>
    {notice && <div className="workbench-notice" role="status"><CheckCircle2 size={18} /> {notice}</div>}
    <section className="workbench-flow">
      <form onSubmit={submitOrganization} className="workbench-step"><span>01 · TENANT</span><h2>Organization</h2><p>Begin a tenant-scoped operational environment.</p><input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} aria-label="Organization name" required minLength={3} /><button disabled={isWorking}>{createOrganization.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Create organization</button></form>
      <form onSubmit={submitSite} className="workbench-step"><span>02 · LOCATION</span><h2>Site</h2><p>Register a campus or building within the selected tenant.</p><input value={siteName} onChange={(event) => setSiteName(event.target.value)} aria-label="Site name" required /><input value={siteCode} onChange={(event) => setSiteCode(event.target.value.toUpperCase())} aria-label="Site code" required pattern="[A-Z0-9_-]{2,64}" /><button disabled={!organizationId || isWorking}>{createSite.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Register site</button></form>
      <form onSubmit={submitMeter} className="workbench-step"><span>03 · SOURCE</span><h2>Meter</h2><p>Set a canonical resource type and unit before any reading arrives.</p><input value={meterName} onChange={(event) => setMeterName(event.target.value)} aria-label="Meter display name" required /><input value={meterKey} onChange={(event) => setMeterKey(event.target.value.toLowerCase())} aria-label="Meter key" required pattern="[a-z0-9_-]{3,96}" /><select value={resourceType} onChange={(event) => setResourceType(event.target.value as typeof resourceType)} aria-label="Resource type">{Object.keys(resourceUnits).map((type) => <option value={type} key={type}>{type} · {resourceUnits[type]}</option>)}</select><button disabled={!organizationId || !siteId || isWorking}>{createMeter.isPending ? <Loader2 className="animate-spin" /> : <Database />} Register meter</button></form>
      <form onSubmit={submitReading} className="workbench-step workbench-step--accent"><span>04 · INGEST</span><h2>Reading</h2><p>Submit one validated, idempotent measurement to the selected meter. Simulated pilot readings are explicitly labeled and must not be treated as campus-source data.</p><select value={meterId ?? ""} onChange={(event) => setMeterId(Number(event.target.value))} aria-label="Target meter"><option value="" disabled>Select a meter</option>{metersQuery.data?.map((meter) => <option value={meter.id} key={meter.id}>{meter.displayName} · {meter.canonicalUnit}</option>)}</select><select value={readingSource} onChange={(event) => setReadingSource(event.target.value as "manual" | "simulated")} aria-label="Reading source"><option value="manual">Manual operational entry</option><option value="simulated">Simulated pilot test — explicitly labeled</option></select><input value={readingValue} onChange={(event) => setReadingValue(event.target.value)} aria-label="Reading value" type="number" min="0" step="0.01" required /><button disabled={!meterId || isWorking}>{ingestReading.isPending ? <Loader2 className="animate-spin" /> : <Send />} Ingest reading</button></form>
    </section>
    <section className="ingestion-history"><header><div><span className="ops-eyebrow">INGESTION AUDIT</span><h2>Recent protected submissions</h2></div><ShieldCheck size={24} /></header>{batchesQuery.isLoading ? <p>Loading ingestion evidence…</p> : batchesQuery.data?.length ? <div className="ingestion-table">{batchesQuery.data.map((batch) => <div key={batch.id}><span>#{batch.id}</span><b>{batch.source.toUpperCase()}</b><span>{batch.status.replaceAll("_", " ")}</span><span>{batch.acceptedRows} accepted</span><time>{new Date(batch.createdAt).toLocaleString()}</time></div>)}</div> : <p>No readings have been submitted for the selected organization yet.</p>}</section>
  </div>;
}

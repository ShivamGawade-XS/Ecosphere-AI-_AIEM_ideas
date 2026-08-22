import { trpc } from "@/lib/trpc";
import { CheckCircle2, Database, FileSpreadsheet, Loader2, Plus, Radio, Send, ShieldCheck, Upload } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";

const resourceUnits: Record<string, string> = { energy: "kWh", water: "m³", waste: "kg", fuel: "L", renewable: "kWh" };

function errorList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ importFileId: number; fileName: string; validRows: number; rejectedRows: number } | null>(null);
  const [factorVersion, setFactorVersion] = useState("aiem-electricity-v1");
  const [factorValue, setFactorValue] = useState("0.82");
  const [factorGeography, setFactorGeography] = useState("AIEM Campus pilot — Goa, India");
  const [factorSource, setFactorSource] = useState("Pilot factor pending governed source approval");
  const [selectedImportId, setSelectedImportId] = useState<number | null>(null);
  const [correctionReadingId, setCorrectionReadingId] = useState<number | null>(null);
  const [correctionValue, setCorrectionValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId && organizationsQuery.data?.[0]) setOrganizationId(organizationsQuery.data[0].organization.id);
  }, [organizationId, organizationsQuery.data]);

  const sitesQuery = trpc.sites.list.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const metersQuery = trpc.meters.list.useQuery({ organizationId: organizationId ?? 0, siteId: siteId ?? undefined }, { enabled: Boolean(organizationId) });
  const batchesQuery = trpc.ingestion.recent.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const importsQuery = trpc.imports.list.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const factorsQuery = trpc.factors.list.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const readingsQuery = trpc.readings.recent.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const importLineageQuery = trpc.lineage.importFile.useQuery({ organizationId: organizationId ?? 0, importFileId: selectedImportId ?? 0 }, { enabled: Boolean(organizationId && selectedImportId) });
  const readingLineageQuery = trpc.lineage.reading.useQuery({ organizationId: organizationId ?? 0, readingId: correctionReadingId ?? 0 }, { enabled: Boolean(organizationId && correctionReadingId) });

  useEffect(() => { if (!siteId && sitesQuery.data?.[0]) setSiteId(sitesQuery.data[0].id); }, [siteId, sitesQuery.data]);
  useEffect(() => { if (!meterId && metersQuery.data?.[0]) setMeterId(metersQuery.data[0].id); }, [meterId, metersQuery.data]);
  useEffect(() => {
    if (!correctionReadingId && readingsQuery.data?.[0]) {
      setCorrectionReadingId(readingsQuery.data[0].reading.id);
      setCorrectionValue(String(readingsQuery.data[0].reading.value));
    }
  }, [correctionReadingId, readingsQuery.data]);

  const createOrganization = trpc.organizations.create.useMutation({ onSuccess: async (created) => { await utils.organizations.mine.invalidate(); setOrganizationId(created.id); setNotice("Organization created. Add its first operational site."); } });
  const createSite = trpc.sites.create.useMutation({ onSuccess: async (created) => { if (organizationId) await utils.sites.list.invalidate({ organizationId }); setSiteId(created.id); setNotice("Site registered. Add a canonical meter before ingesting data."); } });
  const createMeter = trpc.meters.create.useMutation({ onSuccess: async (created) => { if (organizationId) await utils.meters.list.invalidate({ organizationId }); setMeterId(created.id); setNotice("Meter registered. The live reading endpoint is ready."); } });
  const ingestReading = trpc.readings.ingest.useMutation({ onSuccess: async (result) => { if (organizationId) await utils.ingestion.recent.invalidate({ organizationId }); setNotice(result.idempotent ? "This reading was already accepted; duplicate data was not created." : readingSource === "simulated" ? "Simulated pilot reading accepted and visibly labeled in provenance." : "Reading accepted and recorded with provenance."); } });
  const previewCsvImport = trpc.imports.preview.useMutation({
    onSuccess: async (result) => {
      if (!organizationId) return;
      setCsvPreview({ importFileId: result.importFile.id, fileName: result.importFile.fileName, validRows: result.importFile.validRows, rejectedRows: result.importFile.rejectedRows });
      setSelectedImportId(result.importFile.id);
      await utils.imports.list.invalidate({ organizationId });
      setNotice(result.idempotent ? "This source file was already previewed; its original validation evidence has been retained." : `${result.importFile.validRows} row(s) validated; ${result.importFile.rejectedRows} row(s) quarantined with persistent evidence.`);
    },
    onError: (error) => setNotice(`CSV preview failed: ${error.message}`),
  });
  const commitCsvImport = trpc.imports.commit.useMutation({
    onSuccess: async (result) => {
      if (!organizationId) return;
      await Promise.all([utils.imports.list.invalidate({ organizationId }), utils.ingestion.recent.invalidate({ organizationId }), utils.readings.recent.invalidate({ organizationId })]);
      setNotice(result.idempotent ? "This CSV batch was already committed; duplicate readings were not created." : `CSV batch committed: ${result.acceptedRows} accepted and ${result.rejectedRows} quarantined.`);
    },
    onError: (error) => setNotice(`CSV commit failed: ${error.message}`),
  });
  const createFactor = trpc.factors.create.useMutation({ onSuccess: async () => { if (organizationId) await utils.factors.list.invalidate({ organizationId }); setNotice("Factor draft saved. A manager or owner must approve it before monitored carbon calculations can use it."); }, onError: (error) => setNotice(error.message) });
  const approveFactor = trpc.factors.approve.useMutation({ onSuccess: async () => { if (organizationId) await utils.factors.list.invalidate({ organizationId }); setNotice("Factor approved. Future eligible energy calculations will select it by unit and validity period."); }, onError: (error) => setNotice(error.message) });
  const correctReading = trpc.readings.correct.useMutation({ onSuccess: async () => { if (organizationId) await utils.readings.recent.invalidate({ organizationId }); setCorrectionReason(""); setNotice("Correction approved. The raw reading is retained, superseded, and excluded from future monitoring baselines."); }, onError: (error) => setNotice(`Correction failed: ${error.message}`) });

  function submitOrganization(event: FormEvent) { event.preventDefault(); createOrganization.mutate({ name: organizationName }); }
  function submitSite(event: FormEvent) { event.preventDefault(); if (organizationId) createSite.mutate({ organizationId, name: siteName, code: siteCode, timezone: "Asia/Kolkata" }); }
  function submitMeter(event: FormEvent) { event.preventDefault(); if (organizationId && siteId) createMeter.mutate({ organizationId, siteId, displayName: meterName, meterKey, resourceType, canonicalUnit: resourceUnits[resourceType] }); }
  function submitReading(event: FormEvent) {
    event.preventDefault();
    const meter = metersQuery.data?.find((item) => item.id === meterId);
    if (!organizationId || !siteId || !meterId || !meter) return;
    ingestReading.mutate({ organizationId, siteId, meterId, observedAt: new Date(), value: Number(readingValue), unit: meter.canonicalUnit, source: readingSource, idempotencyKey: `${readingSource}-${meterId}-${Date.now()}`, provenance: { entryMethod: "operations-workbench", simulated: readingSource === "simulated", label: readingSource === "simulated" ? "AIEM pilot verification fixture — simulated" : "Manual operational entry" } });
  }
  async function submitCsvPreview(event: FormEvent) { event.preventDefault(); if (organizationId && csvFile) previewCsvImport.mutate({ organizationId, fileName: csvFile.name, csvText: await csvFile.text() }); }
  function submitFactor(event: FormEvent) { event.preventDefault(); if (organizationId) createFactor.mutate({ organizationId, resourceType: "energy", inputUnit: "kWh", emittedKgCo2ePerUnit: Number(factorValue), scope: "Scope 2", geography: factorGeography, methodology: "Versioned organization factor selected by resource, unit, and validity period.", sourceName: factorSource, factorVersion, validFrom: new Date() }); }
  function submitCorrection(event: FormEvent) { event.preventDefault(); if (organizationId && correctionReadingId) correctReading.mutate({ organizationId, originalReadingId: correctionReadingId, observedAt: new Date(), value: Number(correctionValue), reason: correctionReason }); }

  const isWorking = createOrganization.isPending || createSite.isPending || createMeter.isPending || ingestReading.isPending || previewCsvImport.isPending || commitCsvImport.isPending || createFactor.isPending || approveFactor.isPending || correctReading.isPending;

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

    <section className="ingestion-history"><header><div><span className="ops-eyebrow">TRUSTED CSV IMPORT</span><h2>Preview, quarantine, then commit</h2></div><FileSpreadsheet size={24} /></header><p>CSV files require <code>meterKey, observedAt, value, unit</code>. Source-file bytes and every row’s validation evidence are retained. Rejected rows remain quarantined and never enter monitoring.</p><form onSubmit={submitCsvPreview} className="workbench-step"><input type="file" accept=".csv,text/csv" aria-label="CSV source file" onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)} required /><button disabled={!organizationId || !csvFile || isWorking}>{previewCsvImport.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Preview CSV evidence</button></form>{csvPreview && <div className="workbench-notice" role="status"><CheckCircle2 size={18} /><span><b>{csvPreview.fileName}</b> · {csvPreview.validRows} valid · {csvPreview.rejectedRows} quarantined</span><button type="button" disabled={isWorking} onClick={() => organizationId && commitCsvImport.mutate({ organizationId, importFileId: csvPreview.importFileId })}>{commitCsvImport.isPending ? <Loader2 className="animate-spin" /> : <Send />} Commit valid rows</button></div>}{importsQuery.isLoading ? <p>Loading source-file evidence…</p> : importsQuery.isError ? <p role="alert">Source-file evidence is unavailable: {importsQuery.error.message}</p> : importsQuery.data?.length ? <div className="ingestion-table">{importsQuery.data.map((item) => <div key={item.id}><span>#{item.id}</span><b>{item.fileName}</b><span>{item.status.replaceAll("_", " ")}</span><span>{item.validRows} valid · {item.rejectedRows} quarantined</span><button type="button" onClick={() => setSelectedImportId(item.id)}>View lineage</button><time>{new Date(item.createdAt).toLocaleString()}</time></div>)}</div> : <p>No CSV source files have been previewed for this organization.</p>}{selectedImportId && <div className="workbench-notice">{importLineageQuery.isLoading ? <span>Loading row-level lineage…</span> : importLineageQuery.isError ? <span>Lineage unavailable: {importLineageQuery.error.message}</span> : importLineageQuery.data?.rows.length ? <div><p><b>Import #{importLineageQuery.data.importFile.id}</b> · row-level tenant-scoped evidence</p><div className="ingestion-table">{importLineageQuery.data.rows.map((item) => <div key={item.row.id}><span>row {item.row.rowNumber}</span><b>{item.row.meterKey ?? "unmapped meter"}</b><span>{item.row.status}</span><span>{item.row.status === "rejected" ? errorList(item.row.validationErrors).join(" ") || "Validation rejected this row." : item.reading ? `reading #${item.reading.id}` : "awaiting commit"}</span></div>)}</div></div> : <span>No row-level lineage evidence is available.</span>}</div>}</section>

    <section className="ingestion-history"><header><div><span className="ops-eyebrow">FACTOR GOVERNANCE</span><h2>Version carbon factors before using them</h2></div><ShieldCheck size={24} /></header><p>An approved factor is selected only when its resource, unit, and validity window match a reading. Until then, energy calculations retain the explicitly labeled pilot fallback.</p><form onSubmit={submitFactor} className="workbench-step"><input value={factorVersion} onChange={(event) => setFactorVersion(event.target.value)} aria-label="Factor version" required minLength={3} /><input value={factorValue} onChange={(event) => setFactorValue(event.target.value)} aria-label="Emission factor value" type="number" min="0" step="0.000001" required /><input value={factorGeography} onChange={(event) => setFactorGeography(event.target.value)} aria-label="Factor geography" required minLength={2} /><input value={factorSource} onChange={(event) => setFactorSource(event.target.value)} aria-label="Factor source" required minLength={3} /><button disabled={!organizationId || isWorking}>{createFactor.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Save factor draft</button></form>{factorsQuery.isLoading ? <p>Loading governed factor records…</p> : factorsQuery.isError ? <p role="alert">Factor evidence is unavailable: {factorsQuery.error.message}</p> : factorsQuery.data?.length ? <div className="ingestion-table">{factorsQuery.data.map((factor) => <div key={factor.id}><span>#{factor.id}</span><b>{factor.factorVersion}</b><span>{Number(factor.emittedKgCo2ePerUnit).toFixed(6)} kgCO₂e/{factor.inputUnit}</span><span>{factor.status}</span>{factor.status === "draft" ? <button type="button" disabled={isWorking} onClick={() => organizationId && approveFactor.mutate({ organizationId, factorId: factor.id })}>Approve factor</button> : <time>{factor.approvedAt ? `approved ${new Date(factor.approvedAt).toLocaleString()}` : "approval timestamp unavailable"}</time>}</div>)}</div> : <p>No governed factors have been created. The monitoring engine continues to label its energy factor as a pilot fallback.</p>}</section>

    <section className="ingestion-history"><header><div><span className="ops-eyebrow">CORRECTION LINEAGE</span><h2>Supersede, do not overwrite</h2></div><ShieldCheck size={24} /></header><p>Only a manager or owner can approve a correction. The original source value remains auditable and is excluded from future monitoring baselines after supersession.</p>{readingsQuery.isLoading ? <p>Loading active readings for correction…</p> : readingsQuery.isError ? <p role="alert">Reading evidence is unavailable: {readingsQuery.error.message}</p> : readingsQuery.data?.length ? <><form onSubmit={submitCorrection} className="workbench-step"><select value={correctionReadingId ?? ""} onChange={(event) => { const selected = readingsQuery.data?.find((item) => item.reading.id === Number(event.target.value)); setCorrectionReadingId(Number(event.target.value)); if (selected) setCorrectionValue(String(selected.reading.value)); }} aria-label="Reading to correct">{readingsQuery.data.map((item) => <option key={item.reading.id} value={item.reading.id}>{item.meter.displayName} · {item.reading.value} {item.reading.unit}</option>)}</select><input value={correctionValue} onChange={(event) => setCorrectionValue(event.target.value)} aria-label="Corrected reading value" type="number" min="0" step="0.0001" required /><input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} aria-label="Correction reason" minLength={8} maxLength={500} required placeholder="Reason for correction" /><button disabled={!correctionReadingId || correctionReason.trim().length < 8 || isWorking}>{correctReading.isPending ? <Loader2 className="animate-spin" /> : <Send />} Approve correction</button></form>{readingLineageQuery.isLoading ? <p>Loading correction lineage…</p> : readingLineageQuery.isError ? <p role="alert">Correction lineage is unavailable: {readingLineageQuery.error.message}</p> : readingLineageQuery.data ? <div className="ingestion-table"><div><span>source reading</span><b>#{readingLineageQuery.data.reading.id}</b><span>{readingLineageQuery.data.reading.source}</span><span>{readingLineageQuery.data.reading.supersededAt ? `superseded ${new Date(readingLineageQuery.data.reading.supersededAt).toLocaleString()}` : "active"}</span></div>{readingLineageQuery.data.corrections.map((correction) => <div key={correction.id}><span>correction #{correction.id}</span><b>→ reading #{correction.correctedReadingId ?? "pending"}</b><span>{correction.status}</span><span>{correction.reason} · {correction.approvedAt ? new Date(correction.approvedAt).toLocaleString() : "approval pending"}</span></div>)}{readingLineageQuery.data.appliedCorrection && <div><span>applied correction</span><b>#{readingLineageQuery.data.appliedCorrection.id}</b><span>{readingLineageQuery.data.appliedCorrection.status}</span><span>{readingLineageQuery.data.appliedCorrection.reason}</span></div>}</div> : null}</> : <p>No active readings are available for correction.</p>}</section>
  </div>;
}

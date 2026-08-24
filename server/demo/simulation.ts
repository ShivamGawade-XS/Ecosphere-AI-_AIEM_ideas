import * as db from "../db";
import {
  DEMO_METERS,
  DEMO_SITE_CODE,
  DEMO_SIMULATION_VERSION,
  buildDemoBaseline,
  buildDemoCycle,
  buildDemoHvacSpike,
  demoReadingIdempotencyKey,
  type DemoReading,
} from "../domain/demoSimulation";
import { runMonitoringForOrganization, type MonitoringRunSummary } from "../workers/monitoringWorker";

type DemoMeterMap = Map<string, { id: number; siteId: number; canonicalUnit: string }>;

export type DemoSimulationResult = {
  session: { id: number; status: "running" | "spike_injected" | "reset"; cycle: number; anchorObservedAt: Date; spikeInjectedAt?: Date | null };
  stage: "started" | "cycle_advanced" | "spike_injected" | "reset";
  explicitlySimulated: true;
  readingsAccepted: number;
  monitoring?: MonitoringRunSummary;
  resetSummary?: { supersededReadingCount: number; resolvedAlertCount: number; resolvedAnomalyCount: number };
};

function activeSessionOrThrow(session: Awaited<ReturnType<typeof db.getActiveDemoSimulationSession>>) {
  if (!session) throw new Error("Start the clearly labelled demo simulation before advancing it or injecting a spike.");
  return session;
}

async function ensureDemoMeters(input: { organizationId: number; userId: number }) {
  const existingSites = await db.listSites(input.organizationId);
  const site = existingSites.find((candidate) => candidate.code === DEMO_SITE_CODE)
    ?? await db.createSite({ organizationId: input.organizationId, name: "AIEM Campus Demo Fixture", code: DEMO_SITE_CODE, timezone: "Asia/Kolkata", userId: input.userId });
  const existingMeters = await db.listMeters(input.organizationId, site.id);
  const meterMap: DemoMeterMap = new Map();

  for (const definition of DEMO_METERS) {
    const meter = existingMeters.find((candidate) => candidate.meterKey === definition.meterKey)
      ?? await db.createMeter({
        organizationId: input.organizationId,
        siteId: site.id,
        meterKey: definition.meterKey,
        displayName: definition.displayName,
        resourceType: definition.resourceType,
        canonicalUnit: definition.canonicalUnit,
        userId: input.userId,
      });
    meterMap.set(definition.meterKey, { id: meter.id, siteId: site.id, canonicalUnit: definition.canonicalUnit });
  }
  return { siteId: site.id, meters: meterMap };
}

async function persistDemoReadings(input: {
  organizationId: number;
  userId: number;
  sessionId: number;
  meterMap: DemoMeterMap;
  readings: DemoReading[];
}) {
  let accepted = 0;
  for (const reading of input.readings) {
    const meter = input.meterMap.get(reading.meterKey);
    if (!meter) throw new Error(`Demo meter ${reading.meterKey} is unavailable.`);
    const result = await db.ingestReading({
      organizationId: input.organizationId,
      siteId: meter.siteId,
      meterId: meter.id,
      userId: input.userId,
      observedAt: reading.observedAt,
      value: reading.value,
      unit: reading.unit,
      source: "simulated",
      sourceReference: `demo-session:${input.sessionId}`,
      idempotencyKey: demoReadingIdempotencyKey({ sessionId: input.sessionId, meterKey: reading.meterKey, kind: reading.kind, sequence: reading.sequence }),
      provenance: {
        explicitlySimulated: true,
        demoSessionId: input.sessionId,
        demoSimulationVersion: DEMO_SIMULATION_VERSION,
        demoKind: reading.kind,
        demoSequence: reading.sequence,
      },
    });
    if (!result.idempotent) accepted += 1;
  }
  return accepted;
}

async function meterMapForSession(input: { organizationId: number; siteId: number | null }) {
  if (!input.siteId) throw new Error("The demo session no longer has an available fixture site. Reset and start a new demo.");
  const meters = await db.listMeters(input.organizationId, input.siteId);
  const meterMap: DemoMeterMap = new Map();
  for (const definition of DEMO_METERS) {
    const meter = meters.find((candidate) => candidate.meterKey === definition.meterKey);
    if (!meter) throw new Error("The demo meter fixture is incomplete. Reset and start a new demo.");
    meterMap.set(definition.meterKey, { id: meter.id, siteId: meter.siteId, canonicalUnit: meter.canonicalUnit });
  }
  return meterMap;
}

function demoSessionResponse(session: { id: number; status: "running" | "spike_injected" | "reset"; cycle: number; anchorObservedAt: Date; spikeInjectedAt?: Date | null }) {
  return { session, explicitlySimulated: true as const };
}

export async function getDemoSimulationStatus(organizationId: number) {
  const session = await db.getLatestDemoSimulationSession(organizationId);
  return session ? demoSessionResponse(session) : { session: null, explicitlySimulated: true as const };
}

export async function startDemoSimulation(input: { organizationId: number; userId: number; anchorObservedAt?: Date }) : Promise<DemoSimulationResult> {
  const existing = await db.getActiveDemoSimulationSession(input.organizationId);
  if (existing) {
    return {
      ...demoSessionResponse(existing),
      stage: existing.status === "spike_injected" ? "spike_injected" : "started",
      readingsAccepted: 0,
    };
  }
  const anchorObservedAt = input.anchorObservedAt ?? new Date();
  const fixture = await ensureDemoMeters(input);
  const session = await db.createDemoSimulationSession({ ...input, siteId: fixture.siteId, anchorObservedAt });
  const readingsAccepted = await persistDemoReadings({
    organizationId: input.organizationId,
    userId: input.userId,
    sessionId: session.id,
    meterMap: fixture.meters,
    readings: buildDemoBaseline(anchorObservedAt),
  });
  const monitoring = await runMonitoringForOrganization({
    organizationId: input.organizationId,
    runKey: `demo:${session.id}:baseline`,
    trigger: "manual",
  });
  return { ...demoSessionResponse(session), stage: "started", readingsAccepted, monitoring };
}

export async function advanceDemoSimulation(input: { organizationId: number; userId: number }): Promise<DemoSimulationResult> {
  const session = activeSessionOrThrow(await db.getActiveDemoSimulationSession(input.organizationId));
  if (session.status !== "running") throw new Error("This demo already contains the controlled HVAC spike. Reset it before starting another sequence.");
  const nextCycle = session.cycle + 1;
  const meterMap = await meterMapForSession({ organizationId: input.organizationId, siteId: session.siteId });
  const readingsAccepted = await persistDemoReadings({
    organizationId: input.organizationId,
    userId: input.userId,
    sessionId: session.id,
    meterMap,
    readings: buildDemoCycle({ cycle: nextCycle, baseTime: session.anchorObservedAt }),
  });
  const updated = await db.advanceDemoSimulationSession({ organizationId: input.organizationId, sessionId: session.id, cycle: nextCycle, userId: input.userId });
  if (!updated) throw new Error("The demo session could not be advanced because its state changed. Refresh and retry.");
  const monitoring = await runMonitoringForOrganization({ organizationId: input.organizationId, runKey: `demo:${session.id}:cycle:${nextCycle}`, trigger: "manual" });
  return { ...demoSessionResponse(updated), stage: "cycle_advanced", readingsAccepted, monitoring };
}

export async function injectDemoHvacSpike(input: { organizationId: number; userId: number }): Promise<DemoSimulationResult> {
  const session = activeSessionOrThrow(await db.getActiveDemoSimulationSession(input.organizationId));
  if (session.status !== "running") throw new Error("The controlled HVAC spike has already been injected for this demo session.");
  const meterMap = await meterMapForSession({ organizationId: input.organizationId, siteId: session.siteId });
  const readingsAccepted = await persistDemoReadings({
    organizationId: input.organizationId,
    userId: input.userId,
    sessionId: session.id,
    meterMap,
    readings: [buildDemoHvacSpike({ cycle: session.cycle, baseTime: session.anchorObservedAt })],
  });
  const injectedAt = new Date();
  const updated = await db.markDemoSimulationSpikeInjected({ organizationId: input.organizationId, sessionId: session.id, userId: input.userId, injectedAt });
  if (!updated) throw new Error("The demo session could not accept the spike because its state changed. Refresh and retry.");
  const monitoring = await runMonitoringForOrganization({ organizationId: input.organizationId, runKey: `demo:${session.id}:spike`, trigger: "manual" });
  return { ...demoSessionResponse(updated), stage: "spike_injected", readingsAccepted, monitoring };
}

export async function resetDemoSimulation(input: { organizationId: number; userId: number }): Promise<DemoSimulationResult> {
  const session = activeSessionOrThrow(await db.getActiveDemoSimulationSession(input.organizationId));
  const resetSummary = await db.resetDemoSimulationSession({ organizationId: input.organizationId, sessionId: session.id, userId: input.userId });
  if (!resetSummary) throw new Error("The demo session could not be reset because it is already archived. Refresh and start a new demo.");
  const updated = { ...session, status: "reset" as const };
  return { ...demoSessionResponse(updated), stage: "reset", readingsAccepted: 0, resetSummary };
}

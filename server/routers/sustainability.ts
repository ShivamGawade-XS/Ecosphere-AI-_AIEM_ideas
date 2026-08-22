import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { activateScheduledMonitoring, createSimulation, getCampusDashboard, importApprovedCsvTelemetry, injectEnergySpike, runScheduledMonitoring, setAlertStatus, setRecommendationStatus, updateMonitoringPreferences } from "../sustainability";

const simulationSchema = z.object({
  energyReductionPct: z.number().min(0).max(60),
  waterReductionPct: z.number().min(0).max(60),
  wasteDiversionPct: z.number().min(0).max(80),
});

const advisorSchema = z.object({
  question: z.string().trim().min(2).max(600),
  conversation: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) })).max(8).default([]),
});

export const ADVISOR_SYSTEM_PROMPT = "You are the EcoSphere AI sustainability advisor. Give concise, operational guidance using ONLY the telemetry context supplied. Explicitly say 'simulated' when discussing demo telemetry. Never invent measurements, costs, causes, or external facts. Answer in at most three short Markdown bullets and finish with one next action.";

export type AdvisorFallbackContext = {
  ecoScore: number;
  forecast: { nextValue: number; unit: string };
  recommendations: Array<{ detail: string }>;
  alerts: Array<{ title: string; severity: string; observedValue: number; threshold: number; action: string }>;
};

export function buildAdvisorFallback(context: AdvisorFallbackContext) {
  const openAlert = context.alerts[0];
  return openAlert
    ? `- **Simulated alert:** ${openAlert.title} is ${openAlert.severity} severity.\n- **Observed:** ${openAlert.observedValue} versus a threshold of ${openAlert.threshold}.\n- **Action:** ${openAlert.action}\n\n**Next action:** acknowledge the alert after assigning the HVAC check.`
    : `- **Simulated campus status:** EcoScore is ${context.ecoScore}/100.\n- **Forecast:** energy is projected at ${context.forecast.nextValue} ${context.forecast.unit}.\n- **Priority:** ${context.recommendations[0]?.detail}\n\n**Next action:** open the What-If Simulator and test a 15% energy reduction.`;
}

export const sustainabilityRouter = router({
  dashboard: publicProcedure.query(() => getCampusDashboard()),
  injectEnergySpike: publicProcedure.mutation(() => injectEnergySpike()),
  updateAlertStatus: publicProcedure.input(z.object({ alertId: z.number().int().positive(), status: z.enum(["acknowledged", "resolved"]) })).mutation(({ input }) => setAlertStatus(input.alertId, input.status)),
  updateRecommendationStatus: publicProcedure.input(z.object({ recommendationId: z.number().int().positive(), status: z.enum(["active", "dismissed", "implemented"]) })).mutation(({ input }) => setRecommendationStatus(input.recommendationId, input.status)),
  simulate: publicProcedure.input(simulationSchema).mutation(({ input }) => createSimulation(input)),
  updateMonitoring: publicProcedure.input(z.object({ enabled: z.boolean(), scheduleMinutes: z.number().int().min(5).max(60) })).mutation(({ input }) => updateMonitoringPreferences(input)),
  activateScheduledMonitoring: publicProcedure.input(z.object({ scheduleMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(30), z.literal(60)]) })).mutation(({ input, ctx }) => activateScheduledMonitoring({ ...input, cookieHeader: ctx.req.headers.cookie })),
  importCsv: publicProcedure.input(z.object({ sourceId: z.number().int().positive(), csvData: z.string().min(24).max(200_000) })).mutation(({ input }) => importApprovedCsvTelemetry(input)),
  runScheduledCheckForDemo: publicProcedure.mutation(() => runScheduledMonitoring()),
  advisor: publicProcedure.input(advisorSchema).mutation(async ({ input }) => {
    const dashboard = await getCampusDashboard();
    const context = {
      simulated: true,
      ecoScore: dashboard.ecoScore.total,
      metrics: dashboard.metrics,
      forecast: dashboard.forecast,
      alerts: dashboard.alerts.filter(alert => alert.status !== "resolved").map(alert => ({ title: alert.title, severity: alert.severity, observedValue: alert.observedValue, threshold: alert.threshold, action: alert.recommendedAction })),
      recommendations: dashboard.recommendations,
      demoFactors: { electricityEmissionKgCO2ePerKwh: 0.71, electricityRateInrPerKwh: 9.8 },
    };
    try {
      const response = await invokeLLM({ model: "gpt-5-mini", maxTokens: 420, messages: [{ role: "system", content: ADVISOR_SYSTEM_PROMPT }, ...input.conversation, { role: "user", content: `Telemetry context: ${JSON.stringify(context)}\n\nQuestion: ${input.question}` }] });
      const content = response.choices[0]?.message?.content;
      if (typeof content === "string" && content.trim().length > 0) return { content, source: "ai" as const };
    } catch (error) {
      console.warn("[EcoSphere Advisor] Using deterministic fallback", error);
    }
    return { content: buildAdvisorFallback(context), source: "deterministic-fallback" as const };
  }),
});

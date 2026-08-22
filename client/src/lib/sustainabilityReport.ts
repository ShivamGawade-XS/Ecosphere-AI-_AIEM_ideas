import { jsPDF } from "jspdf";

export type SustainabilityReportPayload = {
  campus: { name: string; location: string; mode: string };
  generatedAt: number;
  isSimulated: boolean;
  ecoScore: { total: number; energy: number; water: number; waste: number; carbon: number };
  metrics: Record<"energy" | "water" | "waste" | "carbon", { value: number; unit: string; trend: number }>;
  forecast: { nextValue: number; unit: string; changePct: number; confidence: number };
  alerts: Array<{ title: string; severity: string; status: string; observedValue: number; threshold: number; recommendedAction: string; simulated?: boolean }>;
};

export function createSustainabilityReportFileName(campusName: string, generatedAt: number) {
  const safeCampus = campusName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${safeCampus || "ecosphere"}-sustainability-report-${new Date(generatedAt).toISOString().slice(0, 10)}.pdf`;
}

export function buildReportProvenance(isSimulated: boolean) {
  return isSimulated
    ? "Prototype report: seeded and controlled simulated telemetry is clearly identified. Calculations are deterministic and traceable."
    : "Operational report: values are sourced from approved connected telemetry sources and should be reviewed under campus governance."
}

function drawMetric(doc: jsPDF, x: number, y: number, label: string, value: string, accent: [number, number, number]) {
  doc.setFillColor(242, 250, 246);
  doc.roundedRect(x, y, 123, 68, 8, 8, "F");
  doc.setFillColor(...accent);
  doc.roundedRect(x + 12, y + 13, 4, 28, 2, 2, "F");
  doc.setTextColor(66, 86, 76);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(label.toUpperCase(), x + 24, y + 20);
  doc.setTextColor(11, 48, 34);
  doc.setFontSize(17);
  doc.text(value, x + 24, y + 42);
}

export function downloadSustainabilityReport(payload: SustainabilityReportPayload) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const activeAlerts = payload.alerts.filter(alert => alert.status !== "resolved");
  const dateLabel = new Date(payload.generatedAt).toLocaleString();

  doc.setFillColor(6, 41, 29);
  doc.rect(0, 0, pageWidth, 150, "F");
  doc.setFillColor(96, 222, 177);
  doc.circle(49, 46, 18, "F");
  doc.setTextColor(6, 41, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("E", 43, 52);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(19);
  doc.text("EcoSphere AI", 80, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(174, 226, 200);
  doc.text("SUSTAINABILITY MISSION CONTROL REPORT", 80, 59);
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(payload.campus.name, 32, 108);
  doc.setFontSize(10);
  doc.setTextColor(174, 226, 200);
  doc.text(`${payload.campus.location}  •  Generated ${dateLabel}`, 32, 127);

  doc.setFillColor(245, 250, 247);
  doc.roundedRect(32, 172, pageWidth - 64, 82, 12, 12, "F");
  doc.setTextColor(50, 83, 67);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CURRENT ECOSCORE", 54, 197);
  doc.setTextColor(9, 56, 38);
  doc.setFontSize(38);
  doc.text(String(payload.ecoScore.total), 52, 236);
  doc.setFontSize(12);
  doc.setTextColor(79, 111, 93);
  doc.text("/ 100", 101, 234);
  const scoreText = `Energy ${payload.ecoScore.energy}   Water ${payload.ecoScore.water}   Waste ${payload.ecoScore.waste}   Carbon ${payload.ecoScore.carbon}`;
  doc.setFontSize(10);
  doc.setTextColor(50, 83, 67);
  doc.text(scoreText, 204, 216);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Forecast: ${payload.forecast.nextValue} ${payload.forecast.unit} (${payload.forecast.changePct >= 0 ? "+" : ""}${payload.forecast.changePct}%), confidence ${payload.forecast.confidence}%`, 204, 236);

  doc.setTextColor(25, 64, 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resource indicators", 32, 285);
  drawMetric(doc, 32, 302, "Energy", `${Math.round(payload.metrics.energy.value).toLocaleString()} ${payload.metrics.energy.unit}`, [225, 172, 61]);
  drawMetric(doc, 166, 302, "Water", `${Math.round(payload.metrics.water.value).toLocaleString()} ${payload.metrics.water.unit}`, [75, 172, 209]);
  drawMetric(doc, 300, 302, "Waste", `${Math.round(payload.metrics.waste.value).toLocaleString()} ${payload.metrics.waste.unit}`, [166, 100, 216]);
  drawMetric(doc, 434, 302, "Carbon", `${Math.round(payload.metrics.carbon.value).toLocaleString()} ${payload.metrics.carbon.unit}`, [47, 143, 114]);

  let y = 412;
  doc.setTextColor(25, 64, 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Anomaly and alert status (${activeAlerts.length} active)`, 32, y);
  y += 17;
  if (activeAlerts.length === 0) {
    doc.setFillColor(241, 250, 245);
    doc.roundedRect(32, y, pageWidth - 64, 42, 8, 8, "F");
    doc.setTextColor(34, 112, 78);
    doc.setFontSize(10);
    doc.text("No active anomalies. The controlled demo can be run from Mission Control.", 48, y + 26);
    y += 58;
  } else {
    for (const alert of activeAlerts.slice(0, 3)) {
      const severityColour: [number, number, number] = alert.severity === "critical" ? [190, 42, 42] : alert.severity === "high" ? [194, 97, 42] : [194, 139, 31];
      doc.setFillColor(252, 247, 241);
      doc.roundedRect(32, y, pageWidth - 64, 74, 8, 8, "F");
      doc.setFillColor(...severityColour);
      doc.roundedRect(32, y, 5, 74, 2, 2, "F");
      doc.setTextColor(31, 61, 47);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${alert.title} · ${alert.severity.toUpperCase()} · ${alert.status.toUpperCase()}`, 49, y + 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Observed ${alert.observedValue} against threshold ${alert.threshold}`, 49, y + 37);
      const action = doc.splitTextToSize(`Next action: ${alert.recommendedAction}`, pageWidth - 114);
      doc.text(action, 49, y + 53);
      y += 86;
    }
  }

  doc.setFillColor(235, 247, 239);
  doc.roundedRect(32, y, pageWidth - 64, 55, 8, 8, "F");
  doc.setTextColor(32, 81, 57);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("REPORT PROVENANCE", 48, y + 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize(buildReportProvenance(payload.isSimulated), pageWidth - 96), 48, y + 35);

  doc.setTextColor(105, 132, 118);
  doc.setFontSize(8);
  doc.text("EcoSphere AI — AI-Powered Sustainability Mission Control", 32, 814);
  doc.text(`Report mode: ${payload.campus.mode}`, pageWidth - 125, 814);
  doc.save(createSustainabilityReportFileName(payload.campus.name, payload.generatedAt));
}

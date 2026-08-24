export type EvidenceTimelineItem = {
  id: string;
  stage: "quality" | "anomaly" | "alert" | "recommendation" | "action";
  occurredAt: Date;
  title: string;
  status: string;
  meterName?: string;
  anomalyId?: number;
  actionId?: number;
  detail: string;
};

export function orderEvidenceTimeline(items: EvidenceTimelineItem[], limit = 40): EvidenceTimelineItem[] {
  const boundedLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  return [...items]
    .filter((item) => item.occurredAt instanceof Date && !Number.isNaN(item.occurredAt.getTime()))
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime() || left.id.localeCompare(right.id))
    .slice(0, boundedLimit);
}

export function createManualReadingIdempotencyKey(input: { meterId: number; observedAt: Date; value: number; unit: string }) {
  if (!Number.isInteger(input.meterId) || input.meterId <= 0) throw new Error("A valid meter is required.");
  if (Number.isNaN(input.observedAt.getTime())) throw new Error("A valid observation time is required.");
  if (!Number.isFinite(input.value) || input.value < 0) throw new Error("A non-negative reading value is required.");
  const canonicalValue = input.value.toFixed(6).replace(/\.?(0+)$/, "");
  const canonicalUnit = input.unit.trim().toLowerCase();
  if (!canonicalUnit) throw new Error("A canonical meter unit is required.");
  return `manual-v1:${input.meterId}:${input.observedAt.toISOString()}:${canonicalValue}:${canonicalUnit}`;
}

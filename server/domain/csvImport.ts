export const CSV_IMPORT_VERSION = "csv-import-v1";
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 5_000;

export type CsvImportMeter = { id: number; siteId: number; meterKey: string; canonicalUnit: string };

export type CsvPreviewRow = {
  rowNumber: number;
  rawRecord: Record<string, string>;
  meterKey: string | null;
  observedAt: Date | null;
  value: number | null;
  unit: string | null;
  status: "valid" | "rejected";
  validationErrors: string[];
  meter?: CsvImportMeter;
};

export type CsvPreview = {
  headers: string[];
  rows: CsvPreviewRow[];
  validRows: number;
  rejectedRows: number;
  errorSummary: string | null;
};

function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((value) => value.trim() !== "")) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted value.");
  row.push(cell.replace(/\r$/, ""));
  if (row.some((value) => value.trim() !== "")) records.push(row);
  return records;
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRecord(headers: string[], values: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
}

export function previewCsvImport(input: { csvText: string; meters: CsvImportMeter[]; now?: Date }): CsvPreview {
  if (Buffer.byteLength(input.csvText, "utf8") > MAX_CSV_BYTES) {
    throw new Error(`CSV exceeds the ${MAX_CSV_BYTES / 1024 / 1024} MB import limit.`);
  }
  const records = parseCsvRecords(input.csvText);
  if (!records.length) throw new Error("CSV is empty.");
  const headers = records[0].map(normalizeHeader);
  const requiredHeaders = ["meterkey", "observedat", "value", "unit"];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`CSV requires headers: meterKey, observedAt, value, unit. Missing: ${missing.join(", ")}.`);
  const dataRows = records.slice(1);
  if (dataRows.length > MAX_CSV_ROWS) throw new Error(`CSV exceeds the ${MAX_CSV_ROWS.toLocaleString()} row import limit.`);

  const meterByKey = new Map(input.meters.map((meter) => [meter.meterKey.toLowerCase(), meter]));
  const seenKeys = new Set<string>();
  const now = input.now ?? new Date();
  const rows = dataRows.map((values, index): CsvPreviewRow => {
    const rowNumber = index + 2;
    const rawRecord = normalizeRecord(headers, values);
    const meterKey = rawRecord.meterkey.trim().toLowerCase() || null;
    const unit = rawRecord.unit.trim() || null;
    const parsedValue = Number(rawRecord.value);
    const value = Number.isFinite(parsedValue) ? parsedValue : null;
    const parsedObservedAt = rawRecord.observedat ? new Date(rawRecord.observedat) : null;
    const observedAt = parsedObservedAt && !Number.isNaN(parsedObservedAt.getTime()) ? parsedObservedAt : null;
    const meter = meterKey ? meterByKey.get(meterKey) : undefined;
    const validationErrors: string[] = [];

    if (!meterKey) validationErrors.push("meterKey is required.");
    else if (!meter) validationErrors.push("meterKey is not registered in this organization.");
    if (!observedAt) validationErrors.push("observedAt must be a valid ISO date/time.");
    else if (observedAt.getTime() > now.getTime() + 10 * 60 * 1000) validationErrors.push("observedAt cannot be more than ten minutes in the future.");
    if (value === null || value < 0 || value > 999_999_999) validationErrors.push("value must be a finite non-negative number within the supported range.");
    if (!unit) validationErrors.push("unit is required.");
    else if (meter && meter.canonicalUnit.toLowerCase() !== unit.toLowerCase()) validationErrors.push(`unit must match the meter canonical unit (${meter.canonicalUnit}).`);
    if (values.length > headers.length) validationErrors.push("row has more columns than the header row.");

    const duplicateKey = meter && observedAt ? `${meter.id}:${observedAt.toISOString()}` : null;
    if (duplicateKey && seenKeys.has(duplicateKey)) validationErrors.push("duplicate meter and observedAt value within this file.");
    if (duplicateKey) seenKeys.add(duplicateKey);

    return {
      rowNumber,
      rawRecord,
      meterKey,
      observedAt,
      value,
      unit,
      status: validationErrors.length ? "rejected" : "valid",
      validationErrors,
      meter,
    };
  });
  const validRows = rows.filter((row) => row.status === "valid").length;
  const rejectedRows = rows.length - validRows;
  return {
    headers,
    rows,
    validRows,
    rejectedRows,
    errorSummary: rejectedRows ? `${rejectedRows} of ${rows.length} row${rows.length === 1 ? "" : "s"} require correction before or after commit.` : null,
  };
}

export function sanitizeSpreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  return /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
}

export function serializeSafeCsvRows(rows: Array<Array<unknown>>) {
  return rows
    .map((row) => row.map((value) => `"${sanitizeSpreadsheetCell(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

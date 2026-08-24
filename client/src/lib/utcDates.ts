/** Converts an ISO calendar date into an explicit UTC start or inclusive end. */
export function utcDateBoundary(value: string, boundary: "start" | "end") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Expected a calendar date in YYYY-MM-DD format.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, boundary === "end" ? 23 : 0, boundary === "end" ? 59 : 0, boundary === "end" ? 59 : 0, boundary === "end" ? 999 : 0));
}

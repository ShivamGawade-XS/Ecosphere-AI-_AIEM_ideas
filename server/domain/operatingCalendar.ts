export type OperatingCalendarWindow = {
  id: number;
  timezone: string;
  weekdays: number[];
  startMinuteLocal: number;
  endMinuteLocal: number;
  isActive: boolean;
};

export type OperatingCalendarContext = {
  state: "unconfigured" | "operating" | "outside_configured_hours";
  matchedWindowIds: number[];
  baselineBucket: "unconfigured" | "operating" | "outside_configured_hours";
};

const weekdayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function assertValidTimeZone(timezone: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(); }
  catch { throw new Error("Timezone must be a valid IANA timezone."); }
}

function localClock(observedAt: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(observedAt);
  const get = (type: "weekday" | "hour" | "minute") => parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: weekdayIndex[get("weekday")], minute: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function classifyOperatingCalendar(input: { windows: OperatingCalendarWindow[]; observedAt: Date }) : OperatingCalendarContext {
  const active = input.windows.filter((window) => window.isActive);
  if (!active.length) return { state: "unconfigured", matchedWindowIds: [], baselineBucket: "unconfigured" };
  const matchedWindowIds = active.filter((window) => {
    const local = localClock(input.observedAt, window.timezone);
    return window.weekdays.includes(local.weekday) && local.minute >= window.startMinuteLocal && local.minute < window.endMinuteLocal;
  }).map((window) => window.id);
  const state = matchedWindowIds.length ? "operating" : "outside_configured_hours";
  return { state, matchedWindowIds, baselineBucket: state };
}

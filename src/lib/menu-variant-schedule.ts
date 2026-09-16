export type MenuVariant = "A" | "B";

export type MenuVariantRule = {
  id: string;
  days: number[];
  startTime: string;
  endTime: string;
  variant: MenuVariant;
  date?: string;
};
export type MenuVariantSchedule = { enabled: boolean; defaultVariant: MenuVariant; timeZone: string; rules: MenuVariantRule[] };

export const DEFAULT_MENU_VARIANT_SCHEDULE: MenuVariantSchedule = {
  enabled: false,
  defaultVariant: "A",
  timeZone: "America/Argentina/Buenos_Aires",
  rules: [{ id: "jueves-viernes-mediodia", days: [4, 5], startTime: "10:00", endTime: "17:00", variant: "B" }],
};

const WEEKDAY_NUMBER: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const validTime = (value: unknown): value is string => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const timeToMinutes = (value: string) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };

export function parseMenuVariantSchedule(value: unknown): MenuVariantSchedule {
  const raw = (value ?? {}) as Partial<MenuVariantSchedule> & { days?: number[]; startTime?: string; endTime?: string; scheduledVariant?: MenuVariant; fallbackVariant?: MenuVariant };
  const rules: MenuVariantRule[] = Array.isArray(raw.rules)
    ? raw.rules.map((rule, index) => {
        const item = rule as Partial<MenuVariantRule>;
        return {
          id: typeof item.id === "string" ? item.id : `horario-${index + 1}`,
          days: Array.isArray(item.days) ? item.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [],
          startTime: validTime(item.startTime) ? item.startTime : "10:00",
          endTime: validTime(item.endTime) ? item.endTime : "17:00",
          variant: item.variant === "A" ? "A" : "B",
          ...(validDate(item.date) ? { date: item.date } : {}),
        };
      })
    : raw.startTime
      ? [{ id: "horario-1", days: raw.days ?? [4, 5], startTime: validTime(raw.startTime) ? raw.startTime : "10:00", endTime: validTime(raw.endTime) ? raw.endTime : "17:00", variant: raw.scheduledVariant === "A" ? "A" : "B" }]
      : DEFAULT_MENU_VARIANT_SCHEDULE.rules;

  return {
    enabled: raw.enabled === true,
    defaultVariant: raw.defaultVariant === "B" || raw.fallbackVariant === "B" ? "B" : "A",
    timeZone: typeof raw.timeZone === "string" && raw.timeZone ? raw.timeZone : DEFAULT_MENU_VARIANT_SCHEDULE.timeZone,
    rules,
  };
}

function weeklyRuleMatches(rule: MenuVariantRule, day: number, currentTime: number) {
  const start = timeToMinutes(rule.startTime);
  const end = timeToMinutes(rule.endTime);
  if (start === end || rule.date) return false;
  if (start < end) return rule.days.includes(day) && currentTime >= start && currentTime < end;
  const previousDay = (day + 6) % 7;
  return (rule.days.includes(day) && currentTime >= start) || (rule.days.includes(previousDay) && currentTime < end);
}

function dateRuleMatches(rule: MenuVariantRule, currentDate: string, previousDate: string, currentTime: number) {
  if (!rule.date) return false;
  const start = timeToMinutes(rule.startTime);
  const end = timeToMinutes(rule.endTime);
  if (start === end) return false;
  if (start < end) return rule.date === currentDate && currentTime >= start && currentTime < end;
  return (rule.date === currentDate && currentTime >= start) || (rule.date === previousDate && currentTime < end);
}

function zonedDateParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: get("weekday"),
    hours: Number(get("hour") || 0),
    minutes: Number(get("minute") || 0),
  };
}

export function resolveMenuVariant(manualVariant: MenuVariant, schedule: MenuVariantSchedule, now = new Date()): MenuVariant {
  if (!schedule.enabled) return manualVariant;
  const current = zonedDateParts(now, schedule.timeZone);
  const previous = zonedDateParts(new Date(now.getTime() - 24 * 60 * 60 * 1000), schedule.timeZone);
  const currentTime = current.hours * 60 + current.minutes;

  // Las fechas específicas son excepciones y tienen prioridad sobre la programación semanal.
  const dateMatch = schedule.rules.find((rule) => dateRuleMatches(rule, current.date, previous.date, currentTime));
  if (dateMatch) return dateMatch.variant;

  const weeklyMatch = schedule.rules.find((rule) => weeklyRuleMatches(rule, WEEKDAY_NUMBER[current.weekday], currentTime));
  return weeklyMatch?.variant ?? schedule.defaultVariant;
}

function weeklyIntervals(rule: MenuVariantRule) {
  if (rule.date) return [];
  const start = timeToMinutes(rule.startTime);
  const end = timeToMinutes(rule.endTime);
  if (start === end) return [];
  return rule.days.flatMap((day) => {
    const absoluteStart = day * 1440 + start;
    const absoluteEnd = day * 1440 + end + (end < start ? 1440 : 0);
    return absoluteEnd <= 10080
      ? [[absoluteStart, absoluteEnd] as const]
      : [[absoluteStart, 10080] as const, [0, absoluteEnd - 10080] as const];
  });
}

function dateIntervalsOverlap(left: MenuVariantRule, right: MenuVariantRule) {
  if (!left.date || !right.date) return false;
  const toAbsolute = (rule: MenuVariantRule) => {
    const base = Date.parse(`${rule.date}T00:00:00Z`) / 60000;
    const start = base + timeToMinutes(rule.startTime);
    let end = base + timeToMinutes(rule.endTime);
    if (end <= start) end += 1440;
    return [start, end] as const;
  };
  const [aStart, aEnd] = toAbsolute(left);
  const [bStart, bEnd] = toAbsolute(right);
  return aStart < bEnd && bStart < aEnd;
}

export function findScheduleConflict(rules: MenuVariantRule[]): [number, number] | null {
  for (let left = 0; left < rules.length; left += 1) {
    for (let right = left + 1; right < rules.length; right += 1) {
      if (rules[left].date || rules[right].date) {
        if (dateIntervalsOverlap(rules[left], rules[right])) return [left, right];
        continue;
      }
      const leftIntervals = weeklyIntervals(rules[left]);
      const rightIntervals = weeklyIntervals(rules[right]);
      if (leftIntervals.some(([aStart, aEnd]) => rightIntervals.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd))) return [left, right];
    }
  }
  return null;
}

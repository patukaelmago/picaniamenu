export type MenuVariant = "A" | "B";

export type MenuVariantRule = { id: string; days: number[]; startTime: string; endTime: string; variant: MenuVariant };
export type MenuVariantSchedule = { enabled: boolean; defaultVariant: MenuVariant; timeZone: string; rules: MenuVariantRule[] };

export const DEFAULT_MENU_VARIANT_SCHEDULE: MenuVariantSchedule = {
  enabled: false,
  defaultVariant: "A",
  timeZone: "America/Argentina/Buenos_Aires",
  rules: [{ id: "jueves-viernes-mediodia", days: [4, 5], startTime: "10:00", endTime: "17:00", variant: "B" }],
};

const WEEKDAY_NUMBER: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const validTime = (value: unknown): value is string => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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

function ruleMatches(rule: MenuVariantRule, day: number, currentTime: number) {
  const start = timeToMinutes(rule.startTime);
  const end = timeToMinutes(rule.endTime);
  if (start === end) return false;
  if (start < end) return rule.days.includes(day) && currentTime >= start && currentTime < end;
  const previousDay = (day + 6) % 7;
  return (rule.days.includes(day) && currentTime >= start) || (rule.days.includes(previousDay) && currentTime < end);
}

export function resolveMenuVariant(manualVariant: MenuVariant, schedule: MenuVariantSchedule, now = new Date()): MenuVariant {
  if (!schedule.enabled) return manualVariant;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: schedule.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const match = schedule.rules.find((rule) => ruleMatches(rule, WEEKDAY_NUMBER[weekday], hours * 60 + minutes));
  return match?.variant ?? schedule.defaultVariant;
}

function weeklyIntervals(rule: MenuVariantRule) {
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

export function findScheduleConflict(rules: MenuVariantRule[]): [number, number] | null {
  for (let left = 0; left < rules.length; left += 1) {
    const leftIntervals = weeklyIntervals(rules[left]);
    for (let right = left + 1; right < rules.length; right += 1) {
      const rightIntervals = weeklyIntervals(rules[right]);
      if (leftIntervals.some(([aStart, aEnd]) => rightIntervals.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd))) return [left, right];
    }
  }
  return null;
}

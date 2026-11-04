/**
 * A small parser for OpenStreetMap `opening_hours` values.
 *
 * Supports the forms that cover most Philippine listings:
 *   "24/7", "Mo-Su 10:00-22:00", "Mo-Fr 08:00-17:00; Sa 09:00-12:00",
 *   "Mo-Sa 10:00-14:00,17:00-22:00", "Mo,We,Fr 09:00-18:00", "Su off",
 *   "10:00-21:00" (every day), and ranges past midnight ("18:00-02:00").
 *
 * Anything more complex (months, holidays, sunrise, week numbers) returns
 * undefined, and the app says "No hours info" rather than guessing.
 */
import type { WeekSchedule } from '@/types';

/** Minutes from midnight, per day (index 0 = Monday … 6 = Sunday). End may exceed 1440 (past midnight). */
export type Week = WeekSchedule;

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const emptyWeek = (): Week => DAYS.map(() => []);

function parseDays(selector: string): number[] | undefined {
  const days = new Set<number>();
  for (const part of selector.split(',')) {
    const range = part.trim().split('-');
    const start = DAYS.indexOf(range[0]);
    const end = range.length === 2 ? DAYS.indexOf(range[1]) : start;
    if (start < 0 || end < 0 || range.length > 2) return undefined;
    for (let d = start; ; d = (d + 1) % 7) {
      days.add(d);
      if (d === end) break;
    }
  }
  return [...days];
}

function parseTimes(spec: string): [number, number][] | undefined {
  const ranges: [number, number][] = [];
  for (const part of spec.split(',')) {
    const m = part.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!m) return undefined;
    const start = Number(m[1]) * 60 + Number(m[2]);
    let end = Number(m[3]) * 60 + Number(m[4]);
    if (start > 1440 || end > 1440 * 2) return undefined;
    if (end <= start) end += 1440; // closes after midnight
    ranges.push([start, end]);
  }
  return ranges;
}

export function parseOpeningHours(raw: string | null | undefined): Week | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (value === '24/7') return DAYS.map(() => [[0, 1440]]);

  const week = emptyWeek();
  // Rules are separated by ";". A "," followed by a day name also starts a new rule,
  // but only once the previous part has its hours ("Mo,We,Fr 09:00-18:00" is one rule).
  const rules: string[] = [];
  for (const group of value.split(';')) {
    let pending = '';
    for (const piece of group.split(/,\s*(?=(?:Mo|Tu|We|Th|Fr|Sa|Su)\b)/)) {
      const combined = pending ? `${pending},${piece.trim()}` : piece.trim();
      const daysOnly = /^[A-Za-z,\-\s]*$/.test(combined) && !/\b(off|closed)\b/i.test(combined);
      if (daysOnly) {
        pending = combined;
        continue;
      }
      rules.push(combined);
      pending = '';
    }
    if (pending) return undefined;
  }
  if (rules.length === 0) return undefined;

  for (const rule of rules) {
    // Public/school holiday rules ("PH off") don't change the regular week; skip them.
    if (/^(PH|SH)\b/.test(rule)) continue;
    const m = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?\s*,?\s*)+)?\s*(.*)$/);
    if (!m) return undefined;
    const days = m[1] ? parseDays(m[1].replace(/\s+/g, '').replace(/,$/, '')) : [0, 1, 2, 3, 4, 5, 6];
    const rest = m[2].trim();
    if (!days) return undefined;
    if (/^(off|closed)$/i.test(rest)) {
      for (const d of days) week[d] = [];
      continue;
    }
    const times = rest === '' ? undefined : parseTimes(rest);
    if (!times) return undefined; // unsupported syntax: don't guess
    for (const d of days) week[d] = times; // later rules override earlier ones for the same day
  }
  return week;
}

const dayIndex = (date: Date) => (date.getDay() + 6) % 7; // JS: 0 = Sunday → our 0 = Monday

/** Is it open at `now`, and when does that change? */
export function openState(week: Week, now: Date): { open: boolean; nextChange?: Date } {
  const today = dayIndex(now);
  const minute = now.getHours() * 60 + now.getMinutes();
  const at = (dayOffset: number, minutes: number) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    d.setMinutes(minutes);
    return d;
  };
  // Today's ranges, and yesterday's ranges that run past midnight.
  for (const [start, end] of week[today]) {
    if (minute >= start && minute < end) {
      // A range that ends at midnight and continues straight into the next day (e.g. 24/7) isn't closing.
      let closeDay = 0;
      let closeAt = end;
      while (closeAt === 1440 && closeDay < 7 && week[(today + closeDay + 1) % 7].some(([s]) => s === 0)) {
        closeDay++;
        closeAt = Math.max(...week[(today + closeDay) % 7].filter(([s]) => s === 0).map(([, e]) => e));
      }
      if (closeDay >= 7) return { open: true }; // open around the clock: no closing time to show
      return { open: true, nextChange: at(closeDay, closeAt) };
    }
  }
  for (const [start, end] of week[(today + 6) % 7]) {
    if (end > 1440 && minute < end - 1440 && start < 1440) return { open: true, nextChange: at(0, end - 1440) };
  }
  for (let offset = 0; offset < 8; offset++) {
    const starts = week[(today + offset) % 7].map(([s]) => s).filter((s) => offset > 0 || s > minute);
    if (starts.length > 0) return { open: false, nextChange: at(offset, Math.min(...starts)) };
  }
  return { open: false };
}

const clock = (minutes: number) => {
  const m = minutes % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "Monday: 10:00 AM – 10:00 PM" lines, Monday first, in the language of `labels`. */
export function describeWeek(week: Week, labels: { days: string[]; closed: string; open24: string }): string[] {
  return week.map((ranges, d) => {
    const day = labels.days[d];
    if (ranges.length === 0) return `${day}: ${labels.closed}`;
    if (ranges.length === 1 && ranges[0][0] === 0 && ranges[0][1] >= 1440) return `${day}: ${labels.open24}`;
    return `${day}: ${ranges.map(([s, e]) => `${clock(s)} – ${clock(e)}`).join(', ')}`;
  });
}

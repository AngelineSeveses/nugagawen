import { describe, expect, it } from '@jest/globals';
import { en } from '@/localization/en';
import { fil } from '@/localization/fil';
import { describeWeek, openState, parseOpeningHours } from './opening-hours';

// 4 Nov 2026 is a Wednesday.
const wed = (h: number, m = 0) => new Date(2026, 10, 4, h, m);

describe('parseOpeningHours', () => {
  it('reads common forms', () => {
    expect(parseOpeningHours('24/7')?.every((d) => d.length === 1)).toBe(true);
    expect(parseOpeningHours('Mo-Su 10:00-22:00')?.[2]).toEqual([[600, 1320]]);
    expect(parseOpeningHours('10:00-21:00')?.[6]).toEqual([[600, 1260]]);
    const split = parseOpeningHours('Mo-Fr 08:00-17:00; Sa 09:00-12:00; Su off');
    expect(split?.[0]).toEqual([[480, 1020]]);
    expect(split?.[5]).toEqual([[540, 720]]);
    expect(split?.[6]).toEqual([]);
    expect(parseOpeningHours('Mo-Sa 10:00-14:00,17:00-22:00')?.[1]).toEqual([
      [600, 840],
      [1020, 1320],
    ]);
    expect(parseOpeningHours('Mo,We,Fr 09:00-18:00')?.[1]).toEqual([]);
    expect(parseOpeningHours('Mo-Fr 08:00-17:00, Sa 09:00-12:00')?.[5]).toEqual([[540, 720]]);
    expect(parseOpeningHours('Mo-Su 10:00-22:00; PH off')?.[3]).toEqual([[600, 1320]]);
  });

  it('refuses to guess on unsupported syntax', () => {
    expect(parseOpeningHours('Jan-Mar Mo-Fr 08:00-17:00')).toBeUndefined();
    expect(parseOpeningHours('sunrise-sunset')).toBeUndefined();
    expect(parseOpeningHours('')).toBeUndefined();
    expect(parseOpeningHours(undefined)).toBeUndefined();
  });
});

describe('openState', () => {
  const week = parseOpeningHours('Mo-Fr 08:00-17:00; Sa 09:00-12:00; Su off')!;

  it('knows when a place is open and when it closes', () => {
    const s = openState(week, wed(10));
    expect(s.open).toBe(true);
    expect(s.nextChange?.getHours()).toBe(17);
  });

  it('knows when a closed place opens next', () => {
    const s = openState(week, wed(18));
    expect(s.open).toBe(false);
    expect(s.nextChange?.getDate()).toBe(5); // Thursday
    expect(s.nextChange?.getHours()).toBe(8);
  });

  it('does not invent a closing time for places open around the clock', () => {
    const s = openState(parseOpeningHours('24/7')!, wed(15));
    expect(s.open).toBe(true);
    expect(s.nextChange).toBeUndefined();
    const weekdays = openState(parseOpeningHours('Mo-Fr 00:00-24:00')!, wed(15)); // closes Friday midnight
    expect(weekdays.nextChange?.getDay()).toBe(6); // Saturday 00:00
  });

  it('handles places open past midnight', () => {
    const late = parseOpeningHours('Mo-Su 18:00-02:00')!;
    expect(openState(late, wed(1)).open).toBe(true); // Tuesday night's opening
    expect(openState(late, wed(3)).open).toBe(false);
  });
});

describe('describeWeek', () => {
  it('writes readable lines', () => {
    const week = parseOpeningHours('Mo-Fr 08:00-17:00; Su off')!;
    expect(describeWeek(week, en.hours)[0]).toBe('Monday: 8:00 AM – 5:00 PM');
    expect(describeWeek(week, en.hours)[6]).toBe('Sunday: Closed');
    expect(describeWeek(week, fil.hours)[0]).toBe('Lunes: 8:00 AM – 5:00 PM');
    expect(describeWeek(week, fil.hours)[6]).toBe('Linggo: Sarado');
  });
});

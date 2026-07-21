import {
  toISODate,
  parseISODate,
  weekdayOf,
  addDays,
  parseHHmm,
  minutesOfDay,
  isBeforeCutoff,
  minutesUntilCutoff,
  startOfWeek,
  weekDates,
  datesInRange,
  isActiveDay,
  formatDayLabel,
} from './datetime';

describe('datetime', () => {
  test('toISODate / parseISODate round trip (local)', () => {
    const d = new Date(2026, 6, 20, 9, 30); // 20 Jul 2026, Monday
    expect(toISODate(d)).toBe('2026-07-20');
    expect(toISODate(parseISODate('2026-07-20'))).toBe('2026-07-20');
  });

  test('weekdayOf', () => {
    expect(weekdayOf('2026-07-20')).toBe(1); // Monday
    expect(weekdayOf('2026-07-19')).toBe(0); // Sunday
    expect(weekdayOf('2026-07-25')).toBe(6); // Saturday
  });

  test('addDays crosses month boundary', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('parseHHmm valid and invalid', () => {
    expect(parseHHmm('11:30')).toEqual({ h: 11, m: 30 });
    expect(parseHHmm('09:05')).toEqual({ h: 9, m: 5 });
    expect(parseHHmm('23:59')).toEqual({ h: 23, m: 59 });
    expect(parseHHmm('24:00')).toBeNull();
    expect(parseHHmm('9:99')).toBeNull();
    expect(parseHHmm('abc')).toBeNull();
  });

  test('minutesOfDay', () => {
    expect(minutesOfDay('11:30')).toBe(690);
    expect(minutesOfDay('bad')).toBeNull();
  });

  test('isBeforeCutoff uses injected now', () => {
    const before = new Date(2026, 6, 20, 11, 0);
    const after = new Date(2026, 6, 20, 11, 45);
    expect(isBeforeCutoff('11:30', before)).toBe(true);
    expect(isBeforeCutoff('11:30', after)).toBe(false);
    // exactly at cutoff is NOT before (locked)
    expect(isBeforeCutoff('11:30', new Date(2026, 6, 20, 11, 30))).toBe(false);
  });

  test('minutesUntilCutoff never negative', () => {
    expect(minutesUntilCutoff('11:30', new Date(2026, 6, 20, 11, 0))).toBe(30);
    expect(minutesUntilCutoff('11:30', new Date(2026, 6, 20, 12, 0))).toBe(0);
  });

  test('startOfWeek Monday default', () => {
    // Wed 22 Jul 2026 -> week starts Mon 20 Jul
    expect(startOfWeek('2026-07-22')).toBe('2026-07-20');
    // Sunday belongs to the previous Monday-week
    expect(startOfWeek('2026-07-19')).toBe('2026-07-13');
  });

  test('weekDates returns 7 consecutive days', () => {
    const wd = weekDates('2026-07-22');
    expect(wd).toHaveLength(7);
    expect(wd[0]).toBe('2026-07-20');
    expect(wd[6]).toBe('2026-07-26');
  });

  test('datesInRange inclusive and guards reversed range', () => {
    expect(datesInRange('2026-07-20', '2026-07-22')).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
    ]);
    expect(datesInRange('2026-07-22', '2026-07-20')).toEqual([]);
    expect(datesInRange('2026-07-20', '2026-07-20')).toEqual(['2026-07-20']);
  });

  test('isActiveDay respects weekdays and holidays', () => {
    const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri
    expect(isActiveDay('2026-07-20', weekdays)).toBe(true); // Mon
    expect(isActiveDay('2026-07-19', weekdays)).toBe(false); // Sun
    expect(isActiveDay('2026-07-20', weekdays, ['2026-07-20'])).toBe(false); // holiday
  });

  test('formatDayLabel', () => {
    expect(formatDayLabel('2026-07-20')).toBe('Mon, 20 Jul');
  });
});

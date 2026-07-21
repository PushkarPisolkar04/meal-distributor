import { aggregatePeriod, perMemberSpend, countByDate } from './analytics';
import type { LedgerEntry, Payment } from '@/types';

function charge(uid: string, amount: number, size: 'half' | 'full', date: string): LedgerEntry {
  return { id: `${uid}-${date}`, uid, kind: 'charge', amount, size, date, createdAt: 0, createdBy: 'c' };
}
function pay(uid: string, amount: number, date: string): Payment {
  return { id: `${uid}-p-${date}`, uid, amount, date, method: 'upi', reconciled: false, createdAt: 0, recordedBy: 'c' };
}

const entries: LedgerEntry[] = [
  charge('a', 90, 'full', '2026-07-20'),
  charge('b', 65, 'half', '2026-07-20'),
  charge('a', 90, 'full', '2026-07-21'),
  charge('a', 90, 'full', '2026-08-01'), // outside week range
];
const payments: Payment[] = [pay('a', 90, '2026-07-20'), pay('a', 100, '2026-08-05')];

describe('analytics', () => {
  test('aggregatePeriod counts within range', () => {
    const t = aggregatePeriod(entries, payments, '2026-07-20', '2026-07-26');
    expect(t.tiffinCount).toBe(3);
    expect(t.fullCount).toBe(2);
    expect(t.halfCount).toBe(1);
    expect(t.totalCharged).toBe(245);
    expect(t.totalPaid).toBe(90);
  });

  test('perMemberSpend sorted high to low', () => {
    const rows = perMemberSpend(entries, [{ uid: 'a', name: 'Amit' }, { uid: 'b', name: 'Bo' }], '2026-07-20', '2026-07-26');
    expect(rows[0]).toMatchObject({ uid: 'a', total: 180, count: 2 });
    expect(rows[1]).toMatchObject({ uid: 'b', total: 65, count: 1 });
  });

  test('countByDate groups per day sorted asc', () => {
    const rows = countByDate(entries, '2026-07-20', '2026-07-26');
    expect(rows).toEqual([
      { date: '2026-07-20', count: 2 },
      { date: '2026-07-21', count: 1 },
    ]);
  });
});

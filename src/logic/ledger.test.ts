import {
  signedAmount,
  computeMemberBalance,
  computeAllBalances,
  buildChargesForDay,
  chargesInRange,
  totalOutstanding,
  round2,
} from './ledger';
import type { LedgerEntry, Payment, PriceRecord } from '@/types';

function charge(uid: string, amount: number, date = '2026-07-20'): LedgerEntry {
  return { id: `${uid}-${date}-${amount}`, uid, kind: 'charge', amount, date, createdAt: 0, createdBy: 'c' };
}
function payment(uid: string, amount: number, date = '2026-07-20'): Payment {
  return { id: `${uid}-pay-${amount}`, uid, amount, date, method: 'upi', reconciled: false, createdAt: 0, recordedBy: 'c' };
}

const prices: PriceRecord[] = [
  { id: 'p2', halfPrice: 65, fullPrice: 90, effectiveFrom: '2026-06-01' },
];

describe('ledger balances and carry-over', () => {
  test('signedAmount by kind', () => {
    expect(signedAmount(charge('a', 90))).toBe(90);
    expect(
      signedAmount({ id: 'x', uid: 'a', kind: 'payment', amount: 50, date: '2026-07-20', createdAt: 0, createdBy: 'c' }),
    ).toBe(-50);
    expect(
      signedAmount({ id: 'y', uid: 'a', kind: 'adjustment', amount: 20, direction: '-', date: '2026-07-20', createdAt: 0, createdBy: 'c' }),
    ).toBe(-20);
  });

  test('simple balance: charged 3 tiffins, paid one', () => {
    const entries = [charge('a', 90), charge('a', 90), charge('a', 65)];
    const bal = computeMemberBalance('a', 'Amit', entries, [payment('a', 90)]);
    expect(bal.totalCharged).toBe(245);
    expect(bal.totalPaid).toBe(90);
    expect(bal.balance).toBe(155);
    expect(bal.status).toBe('due');
  });

  test('carry-over: last week unpaid still shows as due this week', () => {
    const lastWeek = [charge('a', 90, '2026-07-13')];
    const thisWeek = [charge('a', 65, '2026-07-20')];
    const bal = computeMemberBalance('a', 'Amit', [...lastWeek, ...thisWeek], []);
    expect(bal.balance).toBe(155); // nothing resets across weeks
  });

  test('partial + later payment reduces balance to settled', () => {
    const entries = [charge('a', 90), charge('a', 90)];
    const pays = [payment('a', 90, '2026-07-20'), payment('a', 90, '2026-07-27')];
    const bal = computeMemberBalance('a', 'Amit', entries, pays);
    expect(bal.balance).toBe(0);
    expect(bal.status).toBe('settled');
  });

  test('overpayment shows advance/credit', () => {
    const bal = computeMemberBalance('a', 'Amit', [charge('a', 65)], [payment('a', 100)]);
    expect(bal.balance).toBe(-35);
    expect(bal.status).toBe('advance');
  });

  test('adjustment fixes a mistake (remove a wrongly-added tiffin)', () => {
    const entries: LedgerEntry[] = [
      charge('a', 90),
      { id: 'adj', uid: 'a', kind: 'adjustment', amount: 90, direction: '-', date: '2026-07-20', note: 'wrong entry', createdAt: 0, createdBy: 'c' },
    ];
    const bal = computeMemberBalance('a', 'Amit', entries, []);
    expect(bal.balance).toBe(0);
  });

  test('buildChargesForDay skips skips and prices by date', () => {
    const drafts = buildChargesForDay(
      [
        { uid: 'a', memberName: 'Amit', choice: 'full' },
        { uid: 'b', memberName: 'Bo', choice: 'half' },
        { uid: 'c', memberName: 'Cy', choice: 'skip' },
      ],
      prices,
      '2026-07-20',
    );
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({ uid: 'a', amount: 90, size: 'full' });
    expect(drafts[1]).toMatchObject({ uid: 'b', amount: 65, size: 'half' });
  });

  test('buildChargesForDay throws when no price configured', () => {
    expect(() =>
      buildChargesForDay([{ uid: 'a', memberName: 'Amit', choice: 'full' }], prices, '2025-01-01'),
    ).toThrow(/No price configured/);
  });

  test('chargesInRange sums only within the window', () => {
    const entries = [
      charge('a', 90, '2026-07-13'),
      charge('a', 65, '2026-07-20'),
      charge('a', 90, '2026-07-21'),
    ];
    expect(chargesInRange('a', entries, '2026-07-20', '2026-07-26')).toBe(155);
  });

  test('computeAllBalances + totalOutstanding', () => {
    const members = [
      { uid: 'a', name: 'Amit' },
      { uid: 'b', name: 'Bo' },
    ];
    const entries = [charge('a', 90), charge('b', 65)];
    const pays = [payment('b', 65)];
    const balances = computeAllBalances(members, entries, pays);
    expect(totalOutstanding(balances)).toBe(90); // only Amit still owes
  });

  test('round2 avoids float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(65 / 3)).toBe(21.67);
  });
});

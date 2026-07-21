// Reporting/analytics aggregations over the ledger. Pure and unit-tested.

import type { LedgerEntry, Payment } from '@/types';

export interface PeriodTotals {
  totalCharged: number;
  tiffinCount: number;
  fullCount: number;
  halfCount: number;
  totalPaid: number;
}

function inRange(date: string, fromISO: string, toISO: string): boolean {
  return date >= fromISO && date <= toISO;
}

/** Totals for charges (and payments) within an inclusive date range. */
export function aggregatePeriod(
  entries: LedgerEntry[],
  payments: Payment[],
  fromISO: string,
  toISO: string,
): PeriodTotals {
  let totalCharged = 0;
  let fullCount = 0;
  let halfCount = 0;
  for (const e of entries) {
    if (e.kind !== 'charge' || !inRange(e.date, fromISO, toISO)) continue;
    totalCharged += e.amount;
    if (e.size === 'full') fullCount += 1;
    else if (e.size === 'half') halfCount += 1;
  }
  const totalPaid = payments
    .filter((p) => inRange(p.date, fromISO, toISO))
    .reduce((s, p) => s + p.amount, 0);
  return {
    totalCharged: round2(totalCharged),
    tiffinCount: fullCount + halfCount,
    fullCount,
    halfCount,
    totalPaid: round2(totalPaid),
  };
}

export interface MemberSpend {
  uid: string;
  name: string;
  total: number;
  count: number;
}

/** Per-member spend within a range, sorted high to low. */
export function perMemberSpend(
  entries: LedgerEntry[],
  members: { uid: string; name: string }[],
  fromISO: string,
  toISO: string,
): MemberSpend[] {
  const nameByUid = new Map(members.map((m) => [m.uid, m.name]));
  const acc = new Map<string, MemberSpend>();
  for (const e of entries) {
    if (e.kind !== 'charge' || !inRange(e.date, fromISO, toISO)) continue;
    const cur =
      acc.get(e.uid) ?? { uid: e.uid, name: nameByUid.get(e.uid) ?? 'Member', total: 0, count: 0 };
    cur.total = round2(cur.total + e.amount);
    cur.count += 1;
    acc.set(e.uid, cur);
  }
  return Array.from(acc.values()).sort((a, b) => b.total - a.total);
}

/** Count tiffins per ISO date (for a simple bar chart). */
export function countByDate(
  entries: LedgerEntry[],
  fromISO: string,
  toISO: string,
): { date: string; count: number }[] {
  const acc = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== 'charge' || !inRange(e.date, fromISO, toISO)) continue;
    acc.set(e.date, (acc.get(e.date) ?? 0) + 1);
  }
  return Array.from(acc.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

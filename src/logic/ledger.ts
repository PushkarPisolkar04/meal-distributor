// Ledger math: per-member running balances with automatic carry-over of unpaid
// amounts, support for partial/irregular payments, and adjustments for fixing
// mistakes. This is the money-critical core, so it is written to be exhaustively
// testable.

import type {
  LedgerEntry,
  MemberBalance,
  Payment,
  PriceRecord,
  TiffinChoice,
} from '@/types';
import { amountForChoice } from './pricing';

/** Signed effect of a ledger entry on what a member owes. */
export function signedAmount(entry: LedgerEntry): number {
  if (entry.kind === 'charge') return entry.amount;
  if (entry.kind === 'payment') return -entry.amount;
  // adjustment: direction decides sign; default '+'
  return entry.direction === '-' ? -entry.amount : entry.amount;
}

function statusForBalance(balance: number): MemberBalance['status'] {
  if (balance > 0.0001) return 'due';
  if (balance < -0.0001) return 'advance';
  return 'settled';
}

/**
 * Compute a single member's balance from their ledger entries and payments.
 * balance = charges + positive adjustments - payments - negative adjustments.
 * A positive balance means the member owes money (it naturally carries over
 * across weeks because nothing resets it). Negative means they are in credit.
 */
export function computeMemberBalance(
  uid: string,
  memberName: string,
  entries: LedgerEntry[],
  payments: Payment[],
): MemberBalance {
  let charges = 0;
  let adjustPlus = 0; // adjustments that increase what they owe
  let adjustMinus = 0; // adjustments that reduce what they owe (a credit)
  for (const e of entries) {
    if (e.uid !== uid) continue;
    if (e.kind === 'charge') charges += e.amount;
    else if (e.kind === 'adjustment') {
      if (e.direction === '-') adjustMinus += e.amount;
      else adjustPlus += e.amount;
    }
  }
  const paid = payments
    .filter((p) => p.uid === uid)
    .reduce((s, p) => s + p.amount, 0);

  const totalCharged = charges + adjustPlus;
  const totalPaid = paid + adjustMinus;
  const balance = round2(totalCharged - totalPaid);
  return {
    uid,
    memberName,
    totalCharged: round2(totalCharged),
    totalPaid: round2(totalPaid),
    balance,
    status: statusForBalance(balance),
  };
}

/** Compute balances for a set of members at once. */
export function computeAllBalances(
  members: { uid: string; name: string }[],
  entries: LedgerEntry[],
  payments: Payment[],
): MemberBalance[] {
  return members.map((m) => computeMemberBalance(m.uid, m.name, entries, payments));
}

export interface ChargeDraft {
  uid: string;
  memberName: string;
  date: string;
  choice: TiffinChoice;
  size: 'half' | 'full';
  amount: number;
}

/**
 * Build charge drafts for a day's orders using dated pricing. Skips produce no
 * charge. Throws when a rate cannot be resolved, so misconfiguration surfaces
 * loudly instead of silently under-billing.
 */
export function buildChargesForDay(
  orders: { uid: string; memberName: string; choice: TiffinChoice }[],
  records: PriceRecord[],
  date: string,
): ChargeDraft[] {
  const drafts: ChargeDraft[] = [];
  for (const o of orders) {
    if (o.choice === 'skip') continue;
    const amount = amountForChoice(o.choice, records, date);
    if (amount == null) {
      throw new Error(`No price configured for ${date}`);
    }
    drafts.push({
      uid: o.uid,
      memberName: o.memberName,
      date,
      choice: o.choice,
      size: o.choice,
      amount,
    });
  }
  return drafts;
}

/** Sum of a member's charges within an inclusive date range (for weekly bills). */
export function chargesInRange(
  uid: string,
  entries: LedgerEntry[],
  fromISO: string,
  toISO: string,
): number {
  return round2(
    entries
      .filter(
        (e) =>
          e.uid === uid &&
          e.kind === 'charge' &&
          e.date >= fromISO &&
          e.date <= toISO,
      )
      .reduce((s, e) => s + e.amount, 0),
  );
}

/** Total outstanding across all members (what the coordinator is still owed). */
export function totalOutstanding(balances: MemberBalance[]): number {
  return round2(
    balances.reduce((s, b) => s + (b.balance > 0 ? b.balance : 0), 0),
  );
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Ledger service: writes charges (one per member per day, idempotent), records
// adjustments for fixing mistakes, and subscribes to all ledger entries so the
// UI can compute balances via the pure logic layer.

import {
  addDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { ledgerCol } from './paths';
import type { LedgerEntry } from '@/types';
import type { ChargeDraft } from '@/logic/ledger';

/** Deterministic id makes a day's charge for a member idempotent (re-running
 *  charge generation won't double-bill). */
function chargeId(uid: string, date: string): string {
  return `charge_${date}_${uid}`;
}

export async function writeCharges(
  orgId: string,
  drafts: ChargeDraft[],
  createdBy: string,
): Promise<void> {
  const batch = writeBatch(getDb());
  for (const d of drafts) {
    const ref = doc(ledgerCol(orgId), chargeId(d.uid, d.date));
    batch.set(ref, {
      uid: d.uid,
      kind: 'charge',
      amount: d.amount,
      size: d.size,
      date: d.date,
      note: `${d.size === 'full' ? 'Full' : 'Half'} tiffin`,
      createdAt: serverTimestamp(),
      createdBy,
    });
  }
  await batch.commit();
}

export async function addAdjustment(
  orgId: string,
  params: {
    uid: string;
    amount: number;
    direction: '+' | '-';
    date: string;
    note: string;
    createdBy: string;
  },
): Promise<void> {
  await addDoc(ledgerCol(orgId), {
    uid: params.uid,
    kind: 'adjustment',
    amount: params.amount,
    direction: params.direction,
    date: params.date,
    note: params.note,
    createdAt: serverTimestamp(),
    createdBy: params.createdBy,
  });
}

export function subscribeLedger(orgId: string, cb: (entries: LedgerEntry[]) => void): () => void {
  return onSnapshot(query(ledgerCol(orgId), orderBy('date', 'desc')), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LedgerEntry, 'id'>) })));
  });
}

export async function getLedger(orgId: string): Promise<LedgerEntry[]> {
  const snap = await getDocs(query(ledgerCol(orgId), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LedgerEntry, 'id'>) }));
}

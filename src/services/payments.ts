// Payment service: coordinator records a payment received, subscribes to the
// list, and toggles the reconciled flag when matched to a bank statement.

import {
  addDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { paymentDoc, paymentsCol } from './paths';
import type { Payment } from '@/types';

export async function recordPayment(
  orgId: string,
  params: {
    uid: string;
    amount: number;
    date: string;
    method: Payment['method'];
    note?: string;
    recordedBy: string;
  },
): Promise<void> {
  await addDoc(paymentsCol(orgId), {
    uid: params.uid,
    amount: params.amount,
    date: params.date,
    method: params.method,
    note: params.note ?? '',
    recordedBy: params.recordedBy,
    reconciled: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribePayments(orgId: string, cb: (payments: Payment[]) => void): () => void {
  return onSnapshot(query(paymentsCol(orgId), orderBy('date', 'desc')), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) })));
  });
}

export async function getPayments(orgId: string): Promise<Payment[]> {
  const snap = await getDocs(query(paymentsCol(orgId), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) }));
}

export async function setReconciled(
  orgId: string,
  id: string,
  reconciled: boolean,
): Promise<void> {
  await updateDoc(paymentDoc(orgId, id), { reconciled });
}
